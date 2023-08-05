import React, { FC, useState, useEffect } from 'react';
import { Container, Alert } from 'react-bootstrap';
import { createStore } from 'redux';
import { importState, setServerSettings, setExpr, addQuery } from '../state/actions';
import appReducer, { ExportedStateV1, ExportedStateV2orV3 } from '../state/reducers';
import { Provider } from 'react-redux';
import PromLensUI from '../PromLens/PromLensUI';
import { PageConfig, PathPrefixProps } from '../types/types';
import { grafanaDatasourceToServerSettings } from '../state/utils';
import { nodeType, valueType, matchType } from '../promql/ast';
import { functionSignatures } from '../promql/functionSignatures';

const store = createStore(appReducer);

// Extracted from https://promlens.com/api/page_config?l=OTuO7josUeU.
const examplePageState = {
  nodeVisualizer: { activeTab: 'graph', endTime: null, range: 7200000, resolution: null, stacked: false },
  queries: [
    {
      ast: {
        args: [
          { type: 'numberLiteral', val: '0.9' },
          {
            expr: {
              args: [
                {
                  matchers: [{ name: '__name__', type: '=', value: 'demo_api_request_duration_seconds_bucket' }],
                  name: 'demo_api_request_duration_seconds_bucket',
                  offset: 0,
                  range: 300000,
                  type: 'matrixSelector',
                },
              ],
              func: { argTypes: ['matrix'], name: 'rate', returnType: 'vector', variadic: 0 },
              type: 'call',
            },
            grouping: ['le', 'method', 'path'],
            op: 'sum',
            param: null,
            type: 'aggregation',
            without: false,
          },
        ],
        func: { argTypes: ['scalar', 'vector'], name: 'histogram_quantile', returnType: 'vector', variadic: 0 },
        type: 'call',
      },
      expr: 'histogram_quantile(0.9, sum by(le, method, path) (rate(demo_api_request_duration_seconds_bucket[5m])))',
      exprStale: false,
    },
    {
      ast: {
        bool: false,
        lhs: {
          expr: {
            args: [
              {
                matchers: [{ name: '__name__', type: '=', value: 'node_cpu_seconds_total' }],
                name: 'node_cpu_seconds_total',
                offset: 0,
                range: 60000,
                type: 'matrixSelector',
              },
            ],
            func: { argTypes: ['matrix'], name: 'rate', returnType: 'vector', variadic: 0 },
            type: 'call',
          },
          grouping: ['job', 'mode'],
          op: 'sum',
          param: null,
          type: 'aggregation',
          without: false,
        },
        matching: { card: 'many-to-one', include: [], labels: ['job'], on: true },
        op: '/',
        rhs: {
          expr: {
            args: [
              {
                matchers: [{ name: '__name__', type: '=', value: 'node_cpu_seconds_total' }],
                name: 'node_cpu_seconds_total',
                offset: 0,
                range: 60000,
                type: 'matrixSelector',
              },
            ],
            func: { argTypes: ['matrix'], name: 'rate', returnType: 'vector', variadic: 0 },
            type: 'call',
          },
          grouping: ['job'],
          op: 'sum',
          param: null,
          type: 'aggregation',
          without: false,
        },
        type: 'binaryExpr',
      },
      expr: 'sum by(job, mode) (rate(node_cpu_seconds_total[1m])) / on(job) group_left sum by(job)(rate(node_cpu_seconds_total[1m]))',
      exprStale: false,
    },
  ],
  selectedNodeIdx: { nodeIdx: 3, queryID: 1 },
  serverURL: 'https://demo.promlabs.com',
  version: 1,
} as ExportedStateV1;

const PromLens: FC<PathPrefixProps> = ({ pathPrefix }) => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [pageConfigLoading, setPageConfigLoading] = useState<boolean>(true);
  const [pageConfigError, setPageConfigError] = useState<string | null>(null);

  const [stateImportError, setStateImportError] = useState<string | null>(null);

  const queryParams = Array.from(
    window.location.search
      .substring(1)
      .split('&')
      .map((p) => p.split('='))
      .map(([a, b]) => [a, decodeURIComponent((b || '').replace(/\+/g, '%20'))])
  ).reduce((map, [key, value]) => {
    if (map.has(key)) {
      map.get(key).push(value);
    } else {
      map.set(key, [value]);
    }
    return map;
  }, new Map());

  // Load the initial page configuration, datasources, and shared page state.
  useEffect(() => {
    let statusCode = 0;
    let statusText = '';
    fetch(`${pathPrefix}/api/page_config?l=${queryParams.get('l') ? queryParams.get('l')[0] : ''}`)
      .then((res) => {
        statusCode = res.status;
        statusText = res.statusText;
        if (statusCode !== 200) {
          return res.text();
        }
        return res.json();
      })
      .then((res) => {
        if (statusCode !== 200) {
          throw new Error(`${statusText}${res !== '' ? `: ${res}` : ''}`);
        }
        return res;
      })
      .then((pageConfig: PageConfig) => {
        if (queryParams.get('example') !== undefined) {
          pageConfig.pageState = examplePageState;
        }

        // Precedence override order:
        //
        // - command-line default
        // - page state from shared link
        // - explicit "?s=<server-url>" override
        // - explicit "?ds=<datasource-id>" override

        // If a command-line default server is present, set that first.
        if (pageConfig.defaultPrometheusURL !== '') {
          store.dispatch(
            setServerSettings({
              access: 'direct',
              datasourceID: null,
              withCredentials: false,
              url: pageConfig.defaultPrometheusURL,
              basicAuthUsername: '',
              basicAuthPassword: '',
            })
          );
        }

        // Import entire page state from shared link reference.
        if (pageConfig.pageState !== null) {
          try {
            store.dispatch(importState(pageConfig.pageState as ExportedStateV1 | ExportedStateV2orV3));
            // TODO: Somewhat duplicated with access in PromLensUI.
            localStorage.setItem('promlens.show-example-page-link', 'false');
          } catch (error) {
            setStateImportError((error as Error).message);
          }
        } else {
          // If no initial page state is provided and Grafana datasources contain a default server,
          // select it.
          const defaultDS = pageConfig.grafanaDatasources.find((ds) => ds.isDefault);
          if (defaultDS !== undefined) {
            store.dispatch(setServerSettings(grafanaDatasourceToServerSettings(defaultDS)));
          }
        }

        // Override Prometheus server from URL for direct access.
        if (queryParams.get('s') && queryParams.get('s').length > 0) {
          store.dispatch(
            setServerSettings({
              access: 'direct',
              datasourceID: null,
              withCredentials: false,
              url: queryParams.get('s')[0],
              basicAuthUsername: queryParams.get('u') ? queryParams.get('u')[0] : undefined,
              basicAuthPassword: queryParams.get('p') ? queryParams.get('p')[0] : undefined,
            })
          );
        }

        // Override Prometheus server from URL for proxy access.
        if (queryParams.get('ds') && queryParams.get('ds').length > 0) {
          const providedDS = pageConfig.grafanaDatasources.find((ds) => ds.id === Number(queryParams.get('ds')[0]));
          if (providedDS !== undefined) {
            store.dispatch(setServerSettings(grafanaDatasourceToServerSettings(providedDS)));
          } else {
            setPageConfigError('No Grafana datasource found with ID provided in the url parameter');
          }
        }

        // Override the expression of the first query from the URL.
        if (queryParams.get('q') && queryParams.get('q').length > 0) {
          queryParams.get('q').forEach((query: string, index: number) => {
            if (index > 0) {
              store.dispatch(addQuery());
            }
            store.dispatch(setExpr(index, query));
          });
        }

        setPageConfig(pageConfig);
      })
      .catch((err) => setPageConfigError(err.message))
      .finally(() => setPageConfigLoading(false));
  }, [
    queryParams.get('l') ? queryParams.get('l')[0] : '',
    queryParams.get('s') ? queryParams.get('s')[0] : '',
    queryParams.get('ds') ? queryParams.get('ds')[0] : '',
    pathPrefix,
  ]);

  return (
    <Container fluid className="promlens-container">
      {pageConfigLoading && <Alert variant="secondary">Loading page configuration...</Alert>}
      {pageConfigError && (
        <Alert variant="danger">
          <strong>Loading page configuration failed:</strong> {pageConfigError}
        </Alert>
      )}

      {stateImportError && (
        <Alert variant="danger">
          <strong>Importing shared page state failed:</strong> {stateImportError}
        </Alert>
      )}

      {stateImportError === null && pageConfigError === null && pageConfig !== null && (
        <Provider store={store}>
          <PromLensUI
            initialTrigger={!!(queryParams.get('q') && queryParams.get('q').length > 0)}
            pathPrefix={pathPrefix}
            datasources={pageConfig.grafanaDatasources}
          />
        </Provider>
      )}
    </Container>
  );
};

export default PromLens;
