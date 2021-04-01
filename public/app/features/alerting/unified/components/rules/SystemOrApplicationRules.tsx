import { css } from 'emotion';
import { DataSourceInstanceSettings, GrafanaTheme } from '@grafana/data';
import { LoadingPlaceholder, useStyles } from '@grafana/ui';
import React, { FC, useMemo } from 'react';
import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { RulesGroup } from './RulesGroup';
import { getRulesDataSources } from '../../utils/datasource';
import { RuleNamespace } from 'app/types/unified-alerting';
import pluralize from 'pluralize';

export const SystemOrApplicationRules: FC = () => {
  const styles = useStyles(getStyles);
  const rules = useUnifiedAlertingSelector((state) => state.promRules);
  const rulesDataSources = useMemo(getRulesDataSources, []);

  const namespaces = useMemo(
    (): Array<{ namespace: RuleNamespace; dataSource: DataSourceInstanceSettings }> =>
      rulesDataSources
        .map((dataSource) => rules[dataSource.name]?.result?.map((namespace) => ({ namespace, dataSource })) || [])
        .flat()
        // sort groups within namespace
        .map(({ namespace, dataSource }) => ({
          namespace: {
            ...namespace,
            groups: namespace.groups.slice().sort((a, b) => a.name.localeCompare(b.name)),
          },
          dataSource,
        }))
        // sort namespaces
        .sort((a, b) => a.namespace.name.localeCompare(b.namespace.name)),
    [rules, rulesDataSources]
  );

  const dataSourcesLoading = useMemo(() => rulesDataSources.filter((ds) => rules[ds.name]?.loading), [
    rules,
    rulesDataSources,
  ]);

  return (
    <section className={styles.wrapper}>
      <div className={styles.sectionHeader}>
        <h5>System or application</h5>
        {dataSourcesLoading.length ? (
          <LoadingPlaceholder
            className={styles.loader}
            text={`Loading rules from ${dataSourcesLoading.length} ${pluralize('source', dataSourcesLoading.length)}`}
          />
        ) : (
          <div />
        )}
      </div>

      {namespaces?.map(({ dataSource, namespace }) =>
        namespace.groups.map((group) => (
          <RulesGroup
            group={group}
            key={`${dataSource.name}-${namespace.name}-${group.name}`}
            namespace={namespace.name}
            rulesSource={dataSource}
          />
        ))
      )}
      {namespaces?.length === 0 && !dataSourcesLoading.length && !!rulesDataSources.length && <p>No rules found.</p>}
      {!rulesDataSources.length && <p>There are no Prometheus or Loki datas sources configured.</p>}
    </section>
  );
};

const getStyles = (theme: GrafanaTheme) => ({
  loader: css`
    margin-bottom: 0;
  `,
  sectionHeader: css`
    display: flex;
    justify-content: space-between;
  `,
  wrapper: css`
    margin-bottom: ${theme.spacing.xl};
  `,
});
