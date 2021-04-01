import { DataSourceInstanceSettings, DataSourceJsonData } from '@grafana/data';
import { RulesSource } from 'app/types/unified-alerting';
import { getAllDataSources } from './config';

export const GRAFANA_RULES_SOURCE_NAME = 'grafana';

export enum DataSourceType {
  Alertmanager = 'grafana-alertmanager-datasource',
  Loki = 'loki',
  Prometheus = 'prometheus',
}

export const RulesDataSourceTypes: string[] = [DataSourceType.Loki, DataSourceType.Prometheus];

export function getRulesDataSources() {
  return getAllDataSources()
    .filter((ds) => RulesDataSourceTypes.includes(ds.type))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getLotexDataSourceByName(dataSourceName: string): DataSourceInstanceSettings {
  const dataSource = getDataSourceByName(dataSourceName);
  if (!dataSource) {
    throw new Error(`Data source ${dataSourceName} not found`);
  }
  if (dataSource.type !== DataSourceType.Loki && dataSource.type !== DataSourceType.Prometheus) {
    throw new Error(`Unexpected data source type ${dataSource.type}`);
  }
  return dataSource;
}

export function getAllRulesSourceNames(): string[] {
  return [...getRulesDataSources().map((r) => r.name), GRAFANA_RULES_SOURCE_NAME];
}

export function getAllRulesSources(): RulesSource[] {
  return [...getRulesDataSources(), GRAFANA_RULES_SOURCE_NAME];
}

export function getRulesSourceName(rulesSource: RulesSource): string {
  return isCloudRulesSource(rulesSource) ? rulesSource.name : rulesSource;
}

export function isCloudRulesSource(rulesSource: RulesSource): rulesSource is DataSourceInstanceSettings {
  return rulesSource !== GRAFANA_RULES_SOURCE_NAME;
}

export function getDataSourceByName(name: string): DataSourceInstanceSettings<DataSourceJsonData> | undefined {
  return getAllDataSources().find((source) => source.name === name);
}

export function getDatasourceAPIId(datasourceName: string) {
  if (datasourceName === GRAFANA_RULES_SOURCE_NAME) {
    return GRAFANA_RULES_SOURCE_NAME;
  }
  return String(getLotexDataSourceByName(datasourceName).id);
}
