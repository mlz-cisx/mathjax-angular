import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { fixMathjaxBugs, getMathjaxContent, isMathjax } from '../utils';
import { MathjaxContent } from '../models';
import { queueMathjax } from './mathjax-loader';

@Directive({
    selector: 'mathjax,[mathjax]',
    standalone: false
})
export class MathjaxDirective implements OnChanges, OnDestroy {
  private revision = 0;
  private destroyed = false;
  //
  private mathJaxExpressions?: MathjaxContent | string;
  //
  private readonly element: HTMLElement;
  //
  @Input('mathjax')
  set mathjax(val: MathjaxContent | string) {
    this.mathJaxExpressions = val;
  }
  //
  constructor(private el: ElementRef) {
    //
    this.element = el.nativeElement;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const expressions = changes.mathjax;
    if (
      !expressions ||
      expressions.currentValue === expressions.previousValue
    ) {
      return;
    }
    const revision = ++this.revision;
    const value = getMathjaxContent(expressions.currentValue) + '';
    const hasMath = isMathjax(value);
    const html = hasMath
      ? `<div class='jax-process'>${fixMathjaxBugs(value)}</div>`
      : value;
    void queueMathjax(async (runtime) => {
      if (this.destroyed || revision !== this.revision) return;
      runtime.typesetClear([this.element]);
      this.element.innerHTML = html;
      if (hasMath) await runtime.typesetPromise([this.element]);
    }).catch((error: Error) => console.error('Typeset failed: ' + error.message));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    void queueMathjax((runtime) => runtime.typesetClear([this.element]))
      .catch(() => undefined);
  }
}
