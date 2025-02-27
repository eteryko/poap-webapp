import * as yup from 'yup';
import emailRegex from 'email-regex';

import { isValidAddressOrENS } from '../lib/helpers';
import { IMAGE_SUPPORTED_FORMATS } from './constants';

const AddressSchema = yup.object().shape({
  address: yup.string().required(),
});

const RedeemSchema = yup.object().shape({
  address: yup
    .mixed()
    .test({
      test: async (value) => {
        let validAddressOrENS = await isValidAddressOrENS(value);
        return validAddressOrENS;
      },
    })
    .required(),
});

const AddressOrEmailSchema = yup.object().shape({
  address: yup
    .mixed()
    .test({
      test: async (value) => {
        let validAddressOrENS = await isValidAddressOrENS(value);
        if (emailRegex({ exact: true }).test(value) || validAddressOrENS) {
          return true;
        }
        return false;
      },
    })
    .required(),
});

const GasPriceSchema = yup.object().shape({
  gasPrice: yup.number().required().positive(),
});

const BurnFormSchema = yup.object().shape({
  tokenId: yup.number().required().positive().integer(),
});

const fileSchema = yup
  .mixed()
  .test('fileFormat', 'Unsupported format, please upload a png file', (value) =>
    IMAGE_SUPPORTED_FORMATS.includes(value.type),
  );

export const templateFormSchema = yup.object().shape({
  name: yup.string().required('This field is required'),
  title_image: yup.mixed().test({
    test: (value) => {
      if (typeof value === 'object') return IMAGE_SUPPORTED_FORMATS.includes(value.type);
      if (typeof value === 'string') return yup.string().isValidSync(value);

      return false;
    },
    message: 'Must be a PNG image',
  }),
  title_link: yup.string().required('This field is required').url('Must be valid URL'),
  header_link_text: yup.string(),
  header_link_url: yup.string().url('Must be valid URL'),
  header_color: yup
    .string()
    .required('This field is required')
    .matches(/^#[0-9A-Fa-f]{6}$/, 'Not a valid Hex color'),
  header_link_color: yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Not a valid Hex color'),
  main_color: yup
    .string()
    .required('This field is required')
    .matches(/^#[0-9A-Fa-f]{6}$/, 'Not a valid Hex color'),
  footer_color: yup
    .string()
    .required('This field is required')
    .matches(/^#[0-9A-Fa-f]{6}$/, 'Not a valid Hex color'),
  left_image_url: yup.mixed().test({
    test: (value) => {
      if (typeof value === 'object') return IMAGE_SUPPORTED_FORMATS.includes(value.type);
      if (typeof value === 'string') return yup.string().isValidSync(value);

      return true;
    },
    message: 'Must be a PNG image',
  }),
  left_image_link: yup.string().url('Must be valid URL'),
  right_image_url: yup.mixed().test({
    test: (value) => {
      if (typeof value === 'object') return IMAGE_SUPPORTED_FORMATS.includes(value.type);
      if (typeof value === 'string') return yup.string().isValidSync(value);

      return true;
    },
    message: 'Must be a PNG image',
  }),
  right_image_link: yup.string().url('Must be valid URL'),
  mobile_image_url: yup.mixed().test({
    test: (value) => {
      if (typeof value === 'object') return IMAGE_SUPPORTED_FORMATS.includes(value.type);
      if (typeof value === 'string') return yup.string().isValidSync(value);

      return true;
    },
    message: 'Must be a PNG image',
  }),
  mobile_image_link: yup.string().url('Must be valid URL'),
  footer_icon: yup.mixed().test({
    test: (value) => {
      if (typeof value === 'object') return IMAGE_SUPPORTED_FORMATS.includes(value.type);
      if (typeof value === 'string') return yup.string().isValidSync(value);

      return false;
    },
    message: 'Must be a PNG image',
  }),
  secret_code: yup
    .string()
    .required('The secret code is required')
    .matches(/^[0-9]{6}$/, 'Must be exactly 6 digits'),
  email: yup.string().email('An email is required'),
});

const PoapEventSchema = yup.object().shape({
  name: yup
    .string()
    .required('A unique name is required')
    .max(150, 'The event name should be less than 150 characters'),
  year: yup
    .number()
    .required()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  id: yup.number(),
  description: yup.string().required('The description is required'),
  start_date: yup.string().required('The start date is required'),
  end_date: yup.string().required('The end date is required'),
  expiry_date: yup.string().required('The expiry date is required'),
  city: yup.string(),
  country: yup.string(),
  event_url: yup.string().url(),
  image: yup.mixed().when('isFile', {
    is: (value) => value,
    then: fileSchema,
    otherwise: yup.string(),
  }),
  secret_code: yup
    .string()
    .required('The secret code is required')
    .matches(/^[0-9]{6}$/, 'Must be exactly 6 digits'),
  email: yup.string().email('An email is required'),
  requested_codes: yup.number(),
});

const PoapEventSchemaEdit = yup.object().shape({
  name: yup
    .string()
    .required('A unique name is required')
    .max(150, 'The event name should be less than 150 characters'),
  year: yup
    .number()
    .required()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  id: yup.number(),
  description: yup.string(),
  start_date: yup.string().required('The start date is required'),
  end_date: yup.string().required('The end date is required'),
  city: yup.string(),
  country: yup.string(),
  event_url: yup.string().url(),
  image: yup.mixed().when('isFile', {
    is: (value) => value,
    then: fileSchema,
    otherwise: yup.string(),
  }),
  secret_code: yup
    .string()
    .required('The secret code is required')
    .matches(/^[0-9]{6}$/, 'Must be exactly 6 digits'),
  email: yup.string().email('An email is required'),
});

const PoapQrRequestSchema = yup.object().shape({
  secret_code: yup
    .string()
    .required('The secret code is required')
    .matches(/^[0-9]{6}$/, 'Must be exactly 6 digits'),
  requested_codes: yup.number(),
});

const IssueForEventFormValueSchema = yup.object().shape({
  addressList: yup.string().required(),
  signer: yup
    .string()
    .required()
    .matches(/^0x[0-9a-fA-F]{40}$/, 'Not a valid address'),
});

const IssueForUserFormValueSchema = yup.object().shape({
  address: yup.string().required(),
  signer: yup
    .string()
    .required()
    .matches(/^0x[0-9a-fA-F]{40}$/, 'Not a valid address'),
});

const ClaimHashSchema = yup.object().shape({
  hash: yup.string().required().length(6),
});

const InboxFormSchema = yup.object().shape({
  title: yup.string().required(),
  description: yup.string().required(),
  recipientFilter: yup.string().required(),
  notificationType: yup.string().required(),
  selectedEvent: yup.number().nullable(),
});

const UpdateModalWithFormikRangeSchema = yup.object().shape({
  from: yup.number().positive().required(),
  to: yup.number().positive().required(),
});

const UpdateModalWithFormikListSchema = yup.object().shape({
  hashesList: yup.string().required(),
  event: yup.object().required(),
});

const UpdateModalWithFormikSelectedQrsSchema = yup.object().shape({});

const CheckoutSchema = yup.object().shape({
  event_id: yup.object().required(),
  fancy_id: yup
    .string()
    .required('A unique name is required')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be URL friendly. No spaces, only ASCII')
    .max(150, 'The event name should be less than 150 characters'),
  max_limit: yup.number().required().min(0),
  timezone: yup.number().required(),
  start_date: yup.string().required('The start date is required'),
  start_time: yup.string().required('The start date is required'),
  end_date: yup.string().required('The end date is required'),
  end_time: yup.string().required('The end date is required'),
});

const DeliverySchema = yup.object().shape({
  slug: yup
    .string()
    .required('A unique name is required')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be URL friendly. No spaces, only ASCII')
    .max(100, 'The event name should be less than 100 characters'),
  card_title: yup.string().required('Card title is required').max(200, 'Card title must be less than 200 characters'),
  card_text: yup.string().required('Card text is required'),
  page_title: yup.string().required('Page title is required').max(200, 'Page title must be less than 200 characters'),
  page_text: yup.string().required('Page text is required'),
  metadata_title: yup
    .string()
    .required('Metadata title text is required')
    .max(200, 'Metadata title must be less than 200 characters'),
  metadata_description: yup
    .string()
    .required('Metadata description is required')
    .max(200, 'Metadata description must be less than 200 characters'),
  image: yup.string().required('An image URL is required'),
  page_title_image: yup.string(),
  edit_codes: yup
    .array()
    .of(
      yup
        .string()
        .required('An edit code is required')
        .matches(/^[0-9]{6}$/, 'Edit code must be six digits, only numbers'),
    )
    .min(1)
    .max(5),
  event_ids: yup.array().of(yup.string().required('An event ID is required')).min(1).max(5),
});

const EventSecretShape = {
  start_date: yup.string().required('from date is required'),
  start_time: yup.string().required('a start time is required'),
  end_date: yup.string().required('to date is required'),
  end_time: yup.string().required('an end time is required'),
  captcha: yup.boolean(),
  active: yup.boolean(),
};

const WebsiteBaseShape = {
  ...EventSecretShape,
  claimName: yup
    .string()
    .required('A unique name is required')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be URL friendly. No spaces, only ASCII')
    .max(100, 'The event name should be less than 100 characters'),
};

const WordBaseShape = {
  ...EventSecretShape,
  secretWord: yup
    .string()
    .required('A unique word is required')
    .max(100, 'The event word should be less than 100 characters'),
};

const WebsiteSchemaWithActiveRequest = yup.object().shape({
  ...WebsiteBaseShape,
  codesQuantity: yup
    .number()
    .required('the amount of requested codes must be greater or equals to zero')
    .moreThan(-1, 'the amount of requested codes must be greater or equals to zero')
    .integer('the amount of requested codes must be an integer'),
});

const WebsiteSchemaWithoutActiveRequest = yup.object().shape({
  ...WebsiteBaseShape,
  codesQuantity: yup
    .number()
    .required('A positive amount of codes is required')
    .positive('the amount of requested codes must be greater than zero')
    .integer('the amount of requested codes must be an integer'),
});

const WordSchemaWithActiveRequest = yup.object().shape({
  ...WordBaseShape,
  codesQuantity: yup
    .number()
    .required('the amount of requested codes must be greater or equals to zero')
    .moreThan(-1, 'the amount of requested codes must be greater or equals to zero')
    .integer('the amount of requested codes must be an integer'),
});

const WordSchemaWithoutActiveRequest = yup.object().shape({
  ...WordBaseShape,
  codesQuantity: yup
    .number()
    .required('A positive amount of codes is required')
    .positive('the amount of requested codes must be greater than zero')
    .integer('the amount of requested codes must be an integer'),
});

const SecretsAuthModalBaseShape = {
  eventId: yup.number().required('Event is required'),
};

const SecretsAuthAdminSchema = yup.object().shape({
  ...SecretsAuthModalBaseShape,
});

const SecretsAuthWithSecretCodeSchema = yup.object().shape({
  ...SecretsAuthModalBaseShape,
  secretCode: yup
    .number()
    .required('Edit Code is required')
    .lessThan(1000000, 'Invalid Edit Code')
    .integer('Invalid Edit Code')
    .min(0, 'Invalid Edit COde'),
});

export {
  AddressSchema,
  GasPriceSchema,
  BurnFormSchema,
  PoapEventSchema,
  PoapEventSchemaEdit,
  ClaimHashSchema,
  RedeemSchema,
  AddressOrEmailSchema,
  IssueForEventFormValueSchema,
  IssueForUserFormValueSchema,
  InboxFormSchema,
  UpdateModalWithFormikRangeSchema,
  UpdateModalWithFormikSelectedQrsSchema,
  UpdateModalWithFormikListSchema,
  CheckoutSchema,
  DeliverySchema,
  WebsiteSchemaWithActiveRequest,
  WebsiteSchemaWithoutActiveRequest,
  PoapQrRequestSchema,
  WordSchemaWithActiveRequest,
  WordSchemaWithoutActiveRequest,
  SecretsAuthWithSecretCodeSchema,
  SecretsAuthAdminSchema,
};
