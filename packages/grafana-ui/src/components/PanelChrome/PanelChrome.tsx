import React, { CSSProperties, ReactNode } from 'react';
import { css } from 'emotion';
import { useStyles, useTheme } from '../../themes';
import { GrafanaTheme } from '@grafana/data';

/**
 * @internal
 */
export interface PanelChromeProps {
  width: number;
  height: number;
  title?: string;
  padding?: PanelPadding;
  leftItems?: React.ReactNode[];
  children: (innerWidth: number, innerHeight: number) => React.ReactNode;
}

/**
 * @internal
 */
export type PanelPadding = 'none' | 'md';

/**
 * @internal
 */
export const PanelChrome: React.FC<PanelChromeProps> = ({
  title = '',
  children,
  width,
  height,
  padding = 'md',
  leftItems = [],
}) => {
  const theme = useTheme();
  const styles = useStyles(getStyles);
  const headerHeight = getHeaderHeight(theme, title, leftItems);
  const { contentStyle, innerWidth, innerHeight } = getContentStyle(padding, theme, width, headerHeight, height);

  const headerStyles: CSSProperties = {
    height: theme.panelHeaderHeight,
  };

  const containerStyles: CSSProperties = { width, height };

  return (
    <div className={styles.container} style={containerStyles}>
      <div className={styles.header} style={headerStyles}>
        <div className={styles.headerTitle}>{title}</div>
        {itemsRenderer(leftItems, (items) => {
          return <div className={styles.leftItems}>{items}</div>;
        })}
      </div>
      <div className={styles.content} style={contentStyle}>
        {children(innerWidth, innerHeight)}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme) => {
  return {
    container: css`
      label: panel-container;
      background-color: ${theme.colors.panelBg};
      border: 1px solid ${theme.colors.panelBorder};
      position: relative;
      border-radius: 3px;
      height: 100%;
      display: flex;
      flex-direction: column;
      flex: 0 0 0;
    `,
    content: css`
      label: panel-content;
      width: 100%;
      flex-grow: 1;
    `,
    header: css`
      label: panel-header;
      display: flex;
      align-items: center;
    `,
    headerTitle: css`
      label: panel-header;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      padding-left: ${theme.panelPadding}px;
      flex-grow: 1;
    `,
    leftItems: css`
      padding-right: ${theme.panelPadding}px;
    `,
  };
};

const itemsRenderer = (items: ReactNode[], renderer: (items: ReactNode[]) => ReactNode): ReactNode => {
  const toRender = React.Children.toArray(items).filter(Boolean);
  return toRender.length > 0 ? renderer(toRender) : null;
};

const getHeaderHeight = (theme: GrafanaTheme, title: string, items: ReactNode[]) => {
  if (title.length > 0 || items.length > 0) {
    return theme.panelHeaderHeight;
  }
  return 0;
};

const getContentStyle = (padding: string, theme: GrafanaTheme, width: number, headerHeight: number, height: number) => {
  const chromePadding = padding === 'md' ? theme.panelPadding : 0;
  const panelBorder = 1 * 2;
  const innerWidth = width - chromePadding * 2 - panelBorder;
  const innerHeight = height - headerHeight - chromePadding * 2 - panelBorder;

  const contentStyle: CSSProperties = {
    padding: chromePadding,
  };

  return { contentStyle, innerWidth, innerHeight };
};
