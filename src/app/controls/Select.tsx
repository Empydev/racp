import {
  FormControl,
  Select as MuiSelect,
  InputLabel,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { ComponentProps, ReactNode, useMemo } from "react";
import { htmlId } from "../util/htmlId";

export type SelectPropsBase<Value, Option> = Omit<
  ComponentProps<typeof FormControl>,
  "onChange"
> & {
  options?: readonly Option[];
  label?: ReactNode;
  empty?: ReactNode;
  autoSort?: boolean;
  helperText?: ReactNode;
} & (
    | { value?: Value; onChange?: (value?: Value) => void }
    | { required: true; value: Value; onChange: (value: Value) => void }
  );

export type SelectProps<Value extends string> =
  | (SelectPropsBase<Value, Value> & { multi?: false })
  | (SelectPropsBase<Value[], Value> & { multi: true });

export function Select<Value extends string>({
  options = emptyStringList as Value[],
  multi,
  label,
  value,
  helperText,
  onChange,
  sx,
  id = typeof label === "string" ? htmlId(label) : undefined,
  empty = "No options",
  autoSort = true,
  required,
  ...props
}: SelectProps<Value>) {
  const sortedOptions = useMemo(
    () => (autoSort ? options.slice().sort() : options),
    [options, autoSort]
  );
  return (
    <FormControl sx={{ minWidth: 120, ...sx }} {...props}>
      {label && <InputLabel size="small">{label}</InputLabel>}
      <MuiSelect
        id={id}
        size="small"
        multiple={multi}
        value={multi ? value ?? emptyStringList : value ?? ""}
        label={label}
        onChange={
          multi
            ? required
              ? (e) => {
                  const values = e.target.value as Value[];
                  if (values.length) {
                    onChange?.(values);
                  }
                }
              : (e) => {
                  const values = e.target.value as Value[];
                  onChange?.(values.length ? values : undefined);
                }
            : required
            ? (e) => {
                if (e.target.value) {
                  onChange?.(e.target.value as Value);
                }
              }
            : (e) => {
                onChange?.(e.target.value as Value);
              }
        }
      >
        {sortedOptions.length === 0 ? (
          <MenuItem disabled>{empty}</MenuItem>
        ) : undefined}
        {sortedOptions.map((option, index) => {
          return (
            <MenuItem key={index} value={option}>
              {option}
            </MenuItem>
          );
        })}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

const emptyStringList: string[] = [];
