import React, { HTMLProps, useRef } from 'react';
import { css, cx } from 'emotion';
import useClickAway from 'react-use/lib/useClickAway';
import { SelectableValue } from '@grafana/data';
import { AsyncSelect, Select } from '../Select/Select';

export interface Props<T> extends Omit<HTMLProps<HTMLDivElement>, 'value' | 'onChange'> {
  value?: SelectableValue<T>;
  options: Array<SelectableValue<T>>;
  onChange: (item: SelectableValue<T>) => void;
  onClickOutside: () => void;
  width: number;
  noOptionsMessage?: string;
  allowCustomValue?: boolean;
  loadOptions?: ((filter: string) => Promise<Array<SelectableValue<T>>>) | undefined;
  defaultOptions?: Array<SelectableValue<T>> | boolean;
  isAsync?: boolean;
}

export function SegmentSelect<T>({
  value,
  options = [],
  onChange,
  onClickOutside,
  width,
  noOptionsMessage = '',
  allowCustomValue = false,
  loadOptions = undefined,
  isAsync = false,
  defaultOptions = [],
  ...rest
}: React.PropsWithChildren<Props<T>>) {
  const ref = useRef<HTMLDivElement>(null);

  useClickAway(ref, () => {
    if (ref && ref.current) {
      // https://github.com/JedWatson/react-select/issues/188#issuecomment-279240292
      // Unfortunately there's no other way of retrieving the (not yet) created new option
      const input = ref.current.querySelector('input[id^="react-select-"]') as HTMLInputElement;
      if (input && input.value) {
        onChange({ value: input.value as any, label: input.value });
      } else {
        onClickOutside();
      }
    }
  });

  if (isAsync) {
    return (
      <div {...rest} ref={ref}>
        <AsyncSelect
          className={cx(
            css`
              width: ${width > 120 ? width : 120}px;
            `
          )}
          defaultOptions={defaultOptions}
          loadOptions={loadOptions}
          noOptionsMessage={noOptionsMessage}
          placeholder=""
          autoFocus={true}
          isOpen={true}
          onChange={onChange}
          value={value}
          allowCustomValue={allowCustomValue}
        />
      </div>
    );
  }

  return (
    <div {...rest} ref={ref}>
      <Select
        className={cx(
          css`
            width: ${width > 120 ? width : 120}px;
          `
        )}
        noOptionsMessage={noOptionsMessage}
        placeholder=""
        autoFocus={true}
        isOpen={true}
        onChange={onChange}
        options={options}
        value={value}
        allowCustomValue={allowCustomValue}
      />
    </div>
  );
}
