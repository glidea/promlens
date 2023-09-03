import React, { FC } from 'react';
import ASTNode, { Aggregation, aggregationType } from '../../../promql/ast';
import { parsePrometheusFloat } from '../../../utils/utils';
import { labelNameList } from '../../../utils/LabelNameList';
import { Alert } from 'react-bootstrap';

const describeAggregationType = (aggrType: aggregationType, param: ASTNode | null) => {
  switch (aggrType) {
    case 'sum':
      return 'sums over the sample values of the input series';
    case 'min':
      return 'takes the minimum of the sample values of the input series';
    case 'max':
      return 'takes the maximum of the sample values of the input series';
    case 'avg':
      return 'calculates the average of the sample values of the input series';
    case 'stddev':
      return 'calculates the population standard deviation of the sample values of the input series';
    case 'stdvar':
      return 'calculates the population standard variation of the sample values of the input series';
    case 'count':
      return 'counts the number of input series';
    case 'group':
      return 'groups the input series by the supplied grouping labels, while setting the sample value to 1';
    case 'count_values':
      if (param === null) {
        throw new Error('encountered count_values() node without label parameter');
      }
      if (param.type !== 'stringLiteral') {
        throw new Error('encountered count_values() node without string literal label parameter');
      }
      return (
        <>
          outputs one time series for each unique sample value in the input series (each counting the number of occurrences
          of that value and indicating the original value in the {labelNameList([param.val])} label)
        </>
      );
    case 'bottomk':
      return 'returns the bottom K series by value';
    case 'topk':
      return 'returns the top K series by value';
    case 'quantile':
      if (param === null) {
        throw new Error('encountered quantile() node without quantile parameter');
      }
      if (param.type === 'numberLiteral') {
        return `calculates the ${param.val}th quantile (${
          parsePrometheusFloat(param.val) * 100
        }th percentile) over the sample values of the input series`;
      }
      return 'calculates a quantile over the sample values of the input series';
    default:
      throw new Error(`invalid aggregation type ${aggrType}`);
  }
};

const describeAggregationGrouping = (grouping: string[], without: boolean) => {
  if (without) {
    return <>aggregating away the [{labelNameList(grouping)}] label dimensions</>;
  }

  if (grouping.length > 0) {
    return <>grouped by their [{labelNameList(grouping)}] label dimensions</>;
  }

  return 'aggregating away any label dimensions';
};

interface AggregationExplainViewProps {
  node: Aggregation;
}

const AggregationExplainView: FC<AggregationExplainViewProps> = ({ node }) => {
  return (
    <Alert variant="secondary">
      <p>{codes[node.op]}</p>
      <hr />
      <p>High level:</p>

      <p>
        This node {describeAggregationType(node.op, node.param)}, {describeAggregationGrouping(node.grouping, node.without)}.
      </p>
    </Alert>
  );
};

const codes: Record<string, React.ReactNode> = {
  sum: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L179-202"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  min: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L282-298"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  max: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L300-316"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  avg: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L318-344"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  stddev: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L346-363"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  stdvar: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L365-396"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  count: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L398-415"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  group: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L163-177"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  count_values: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L533-601"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  bottomk: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L603-631"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  topk: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L603-631"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
  quantile: (
    <>
      Code level with AI:{' '}
      <a
        href="https://sourcegraph.com/github.com/prometheus/prometheus@v2.46.0/-/blob/promql/engine.go?L2515-2848"
        target="_blank"
      >
        Prometheus@v2.46.0
      </a>
      ,{' '}
      <a
        href="https://sourcegraph.com/github.com/VictoriaMetrics/VictoriaMetrics@v1.79.6/-/blob/app/vmselect/promql/aggr.go?L1110-1121"
        target="_blank"
      >
        VictoriaMetrics@v1.79.6
      </a>
      .
    </>
  ),
};

export default AggregationExplainView;
