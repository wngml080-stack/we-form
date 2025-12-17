import { useState, useCallback } from 'react';

/**
 * 폼 상태 관리를 위한 커스텀 훅
 *
 * @example
 * const { form, updateField, setForm, resetForm } = useForm({
 *   name: '',
 *   email: '',
 * });
 *
 * <Input
 *   value={form.name}
 *   onChange={(e) => updateField('name', e.target.value)}
 * />
 */
export function useForm<T extends Record<string, any>>(initialState: T) {
  const [form, setForm] = useState<T>(initialState);

  /**
   * 개별 필드 업데이트
   * @param field - 업데이트할 필드명
   * @param value - 새 값
   */
  const updateField = useCallback((field: keyof T, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * 여러 필드 한번에 업데이트
   * @param updates - 업데이트할 필드들의 객체
   */
  const updateFields = useCallback((updates: Partial<T>) => {
    setForm(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  /**
   * 폼 초기화
   */
  const resetForm = useCallback(() => {
    setForm(initialState);
  }, [initialState]);

  /**
   * 특정 상태로 폼 재설정
   * @param newState - 새로운 폼 상태
   */
  const setFormState = useCallback((newState: T) => {
    setForm(newState);
  }, []);

  return {
    form,
    updateField,
    updateFields,
    resetForm,
    setForm: setFormState,
  };
}

/**
 * Input 컴포넌트용 헬퍼 - onChange 이벤트 자동 처리
 *
 * @example
 * const { form, getInputProps } = useFormWithHelpers({ name: '' });
 *
 * <Input {...getInputProps('name')} />
 */
export function useFormWithHelpers<T extends Record<string, any>>(initialState: T) {
  const formHook = useForm(initialState);

  /**
   * Input 컴포넌트에 필요한 props 반환
   * @param field - 필드명
   */
  const getInputProps = useCallback((field: keyof T) => {
    return {
      value: formHook.form[field] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        formHook.updateField(field, e.target.value);
      },
    };
  }, [formHook]);

  /**
   * Select 컴포넌트용 props 반환
   * @param field - 필드명
   */
  const getSelectProps = useCallback((field: keyof T) => {
    return {
      value: formHook.form[field] || '',
      onValueChange: (value: string) => {
        formHook.updateField(field, value);
      },
    };
  }, [formHook]);

  return {
    ...formHook,
    getInputProps,
    getSelectProps,
  };
}
