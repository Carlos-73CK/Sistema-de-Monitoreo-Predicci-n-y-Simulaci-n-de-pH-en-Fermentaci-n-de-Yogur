import React from 'react';
import ValidatedInput from './ValidatedInput';

export default function CustomInput({
  label,
  value,
  onChangeText,
  metricType,
  placeholder,
  unit,
}) {
  return (
    <ValidatedInput
      etiqueta={label}
      valor={value}
      onChangeText={onChangeText}
      tipo={metricType}
      placeholder={placeholder}
      unidad={unit}
    />
  );
}
