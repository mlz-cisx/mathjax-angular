import { ModuleWithProviders, NgModule } from '@angular/core';
import { MathjaxDirective } from './mathjax.directive';
import { RootMathjaxConfig } from '../models';
import { loadMathjax } from './mathjax-loader';

@NgModule({
  declarations: [MathjaxDirective],
  exports: [MathjaxDirective],
})
export class MathjaxModule {
  constructor(private moduleConfig: RootMathjaxConfig) {
    loadMathjax(this.moduleConfig ?? {});
  }

  public static forRoot(
    config?: RootMathjaxConfig
  ): ModuleWithProviders<MathjaxModule> {
    return {
      ngModule: MathjaxModule,
      providers: [{ provide: RootMathjaxConfig, useValue: config ?? {} }],
    };
  }
  public static forChild(): ModuleWithProviders<MathjaxModule> {
    return {
      ngModule: MathjaxModule,
    };
  }
}
