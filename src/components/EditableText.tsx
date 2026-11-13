import React, { useRef, useEffect } from 'react';
import { useOwnerEdit, SiteTextsType } from '../context/OwnerEditContext';
import { Edit3 } from 'lucide-react';

interface EditableTextProps {
  fieldKey?: keyof SiteTextsType;
  value?: string;
  onChange?: (value: string) => void;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'blockquote' | 'small' | 'div';
  className?: string;
  style?: React.CSSProperties;
  inline?: boolean;
  label?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  fieldKey,
  value,
  onChange,
  as: Component = 'span',
  className = '',
  style = {},
  inline = false,
  label,
}) => {
  const { isOwnerMode, siteTexts, updateText } = useOwnerEdit();

  const textValue =
    value !== undefined ? value : fieldKey ? siteTexts[fieldKey] || '' : '';

  const commitChange = (newVal: string) => {
    if (onChange) {
      onChange(newVal);
    } else if (fieldKey) {
      updateText(fieldKey, newVal);
    }
  };

  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== textValue) {
      ref.current.innerText = textValue;
    }
  }, [textValue]);

  if (!isOwnerMode) {
    return React.createElement(
      Component,
      { className, style },
      textValue
    );
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const newText = e.currentTarget.innerText;
    if (newText !== textValue) {
      commitChange(newText);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const newText = e.currentTarget.innerText;
    commitChange(newText);
  };

  return (
    <span
      className={`relative group/editable ${inline ? 'inline-block' : 'inline-block w-full'}`}
      onClick={(e) => {
        if (isOwnerMode) {
          e.stopPropagation();
        }
      }}
    >
      {React.createElement(
        Component,
        {
          ref,
          contentEditable: true,
          suppressContentEditableWarning: true,
          onBlur: handleBlur,
          onInput: handleInput,
          className: `${className} outline-dashed outline-2 outline-amber-500/70 hover:outline-amber-600 bg-amber-50/20 hover:bg-amber-50/40 rounded px-1 transition-all focus:outline-solid focus:outline-amber-600 focus:bg-amber-100/30 cursor-text`,
          style,
          title: `Owner: Click here to directly edit ${label || fieldKey || 'text'}`,
        },
        textValue
      )}
      <span className="absolute -top-3 -right-2 hidden group-hover/editable:flex items-center space-x-1 bg-amber-700 text-white text-2xs px-1.5 py-0.5 rounded shadow-xs pointer-events-none select-none z-30 font-google-sans whitespace-nowrap">
        <Edit3 className="w-2.5 h-2.5" />
        <span>Type to edit</span>
      </span>
    </span>
  );
};
