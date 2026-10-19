import { TextBoxContext } from 'app/shared/model';

export function textBoxTileStyle(context: TextBoxContext): object {
  return {
    'background-color': context.backgroundColor ?? null,
    '--koia-text-box-border-width': context.borderWidth + 'px',
    '--koia-text-box-border-color': context.borderColor ?? null
  };
}
