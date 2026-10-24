import { PlatformLocation } from '@angular/common';
import { EnvironmentProviders, inject, Injectable, provideAppInitializer } from '@angular/core';
import { convertToParamMap, DefaultUrlSerializer, ParamMap } from '@angular/router';
import { QueryParamExtractor } from 'app/shared/utils/query-param-extractor';

/**
 * keeps the parameters of the URL fragment, which never reaches a web server, as loaded before the router re-encodes it
 */
@Injectable({ providedIn: 'root' })
export class LaunchParamsService {

  private readonly fragment: string | null;
  private readonly fragmentParams: ParamMap;

  constructor(platformLocation: PlatformLocation) {
    const rawFragment = platformLocation.hash.substring(1);
    try {
      this.fragment = decodeURIComponent(rawFragment);
      this.fragmentParams = new DefaultUrlSerializer().parse('/?' + rawFragment).queryParamMap;
    } catch {
      this.fragment = null;
      this.fragmentParams = convertToParamMap({});
    }
  }

  /**
   * @param fragment the URL fragment decoded by the router
   * @returns the parameters of the loaded URL fragment while the router still shows it and it carries a host, otherwise the query parameters
   */
  paramsOf(queryParams: ParamMap, fragment: string | null): ParamMap {
    return fragment === this.fragment && this.fragmentParams.has(QueryParamExtractor.HOST) ? this.fragmentParams : queryParams;
  }
}

/**
 * creates the [[LaunchParamsService]] before the initial navigation
 */
export function provideLaunchParams(): EnvironmentProviders {
  return provideAppInitializer(() => { inject(LaunchParamsService); });
}
