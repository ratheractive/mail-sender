import Handlebars from 'handlebars';

export const stringTpl = (tpl: string, values: { [key: string]: string }): string => {
  return Object.entries(values)
      .reduce((agr, [key, value]) => agr.replaceAll(`{${key}}`, value), tpl);
}

export const hbsTpl = (path: string, values: { [key: string]: string }): string => {
  let template = Handlebars.compile(path);
  return template(values);
}
