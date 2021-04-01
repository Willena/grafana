import { DataSourceInstanceSettings, GrafanaTheme } from '@grafana/data';
import { Icon, InfoBox, useStyles, Button } from '@grafana/ui';
import { SerializedError } from '@reduxjs/toolkit';
import React, { FC, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { AlertingPageWrapper } from './components/AlertingPageWrapper';
import { NoRulesSplash } from './components/rules/NoRulesCTA';
import { SystemOrApplicationRules } from './components/rules/SystemOrApplicationRules';
import { useUnifiedAlertingSelector } from './hooks/useUnifiedAlertingSelector';
import { fetchAllPromAndRulerRules } from './state/actions';
import { getRulesDataSources, GRAFANA_RULES_SOURCE_NAME, isCloudRulesSource } from './utils/datasource';
import { css } from 'emotion';
import { ThresholdRules } from './components/rules/ThresholdRules';
import { useCombinedRuleNamespaces } from './hooks/useCombinedRuleNamespaces';
import { RULE_LIST_POLL_INTERVAL_MS } from './utils/constants';

export const RuleList: FC = () => {
  const dispatch = useDispatch();
  const styles = useStyles(getStyles);
  const rulesDataSources = useMemo(getRulesDataSources, []);

  // fetch rules, then poll every RULE_LIST_POLL_INTERVAL_MS
  useEffect(() => {
    dispatch(fetchAllPromAndRulerRules());
    const interval = setInterval(() => dispatch(fetchAllPromAndRulerRules()), RULE_LIST_POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
    };
  }, [dispatch]);

  const rules = useUnifiedAlertingSelector((state) => state.promRules);

  const requests = Object.values(rules);
  const dispatched = !!requests.find((r) => r.dispatched);
  const loading = !!requests.find((r) => r.loading);
  const haveResults = !!requests.find((r) => r.dispatched && (r.result?.length || !!r.error));

  const cloudErrors = useMemo(
    () =>
      rulesDataSources.reduce<Array<{ error: SerializedError; dataSource: DataSourceInstanceSettings }>>(
        (result, dataSource) => {
          const error = rules[dataSource.name]?.error;
          if (error) {
            return [...result, { dataSource, error }];
          }
          return result;
        },
        []
      ),
    [rules, rulesDataSources]
  );

  const grafanaError = rules[GRAFANA_RULES_SOURCE_NAME]?.error;

  const combinedNamespaces = useCombinedRuleNamespaces();
  const [thresholdNamespaces, systemNamespaces] = useMemo(() => {
    const sorted = combinedNamespaces
      .map((namespace) => ({
        ...namespace,
        groups: namespace.groups.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      sorted.filter((ns) => ns.rulesSource === GRAFANA_RULES_SOURCE_NAME),
      sorted.filter((ns) => isCloudRulesSource(ns.rulesSource)),
    ];
  }, [combinedNamespaces]);

  return (
    <AlertingPageWrapper isLoading={loading && !haveResults}>
      {(cloudErrors || grafanaError) && (
        <InfoBox
          data-testid="cloud-rulessource-errors"
          title={
            <h4>
              <Icon className={styles.iconError} name="exclamation-triangle" size="xl" />
              Errors loading rules
            </h4>
          }
          severity="error"
        >
          {grafanaError && <div>Failed to load threshold rules: {grafanaError.message || 'Unknown error.'}</div>}
          {cloudErrors.map(({ dataSource, error }) => (
            <div key={dataSource.name}>
              Failed to load rules from <a href={`datasources/edit/${dataSource.id}`}>{dataSource.name}</a>:{' '}
              {error.message || 'Unknown error.'}
            </div>
          ))}
        </InfoBox>
      )}
      <div className={styles.buttonsContainer}>
        <div />
        <a href="/alerting/new">
          <Button icon="plus">New alert rule</Button>
        </a>
      </div>
      {dispatched && !loading && !haveResults && <NoRulesSplash />}
      {haveResults && <ThresholdRules namespaces={thresholdNamespaces} />}
      {haveResults && <SystemOrApplicationRules namespaces={systemNamespaces} />}
    </AlertingPageWrapper>
  );
};

const getStyles = (theme: GrafanaTheme) => ({
  iconError: css`
    color: ${theme.palette.red};
    margin-right: ${theme.spacing.md};
  `,
  buttonsContainer: css`
    margin-bottom: ${theme.spacing.md};
    display: flex;
    justify-content: space-between;
  `,
});
