import type { PluginExtensionConfig } from '@grafana/data';
import type {
  TransformerPlugin,
  Registry,
  TransformerRegistryItem,
  TransformerPluginMeta
} from '@grafana/data';
import type { AppPluginConfig } from '@grafana/runtime';
import { startMeasure, stopMeasure } from 'app/core/utils/metrics';

import * as pluginLoader from './plugin_loader';

export type PluginPreloadResult = {
  pluginId: string;
  error?: unknown;
  extensionConfigs: PluginExtensionConfig[];
};

export async function preloadPlugins(apps: Record<string, AppPluginConfig> = {}): Promise<PluginPreloadResult[]> {
  startMeasure('frontend_plugins_preload');
  const pluginsToPreload = Object.values(apps).filter((app) => app.preload);
  const result = await Promise.all(pluginsToPreload.map(preload));
  stopMeasure('frontend_plugins_preload');
  return result;
}

async function preload(config: AppPluginConfig): Promise<PluginPreloadResult> {
  const { path, version, id: pluginId } = config;
  try {
    startMeasure(`frontend_plugin_preload_${pluginId}`);
    const { plugin } = await pluginLoader.importPluginModule({
      path,
      version,
      isAngular: config.angularDetected,
      pluginId,
    });
    const { extensionConfigs = [] } = plugin;
    return { pluginId, extensionConfigs };
  } catch (error) {
    console.error(`[Plugins] Failed to preload plugin: ${path} (version: ${version})`, error);
    return { pluginId, extensionConfigs: [], error };
  } finally {
    stopMeasure(`frontend_plugin_preload_${pluginId}`);
  }
}

export async function loadTransformerPlugins(transformerPlugins: Record<string, TransformerPluginMeta>, transformRegistry: Registry<TransformerRegistryItem<any>>){
  const pluginsToPreload = Object.values(transformerPlugins);
  return Promise.all(pluginsToPreload.map(loadTransformerPlugin)).then(values => values.forEach(v => v.transformers.forEach(t => transformRegistry.register(t))));
}

async function loadTransformerPlugin(config: TransformerPluginMeta): Promise<TransformerPlugin> {
  const { module, info } = config;
  try {
    return await pluginLoader.importPluginModule(module, info.version).then((pluginExports) => {
      const plugin = pluginExports.plugin as TransformerPlugin;
      plugin.meta = config;
      console.log(plugin)
      return plugin ;
    });
  } catch (error) {
    console.error(`[Plugins] Failed to preload plugin: ${module} (version: ${info.version})`, error);
    throw error;
  }
}
