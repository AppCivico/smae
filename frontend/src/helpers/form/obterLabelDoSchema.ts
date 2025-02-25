import { ObjectSchema } from 'yup';

function obterLabelDoSchema(shape: ObjectSchema<any>, field: string) {
  return shape.fields[field].spec.label;
}

export default obterLabelDoSchema;
