import { body } from 'express-validator'
const schema = [
    body('wr_subject')
    .trim()
    .exists()
    .isLength({min:2, max:50})
    .withMessage('제목은 최소 2자 이상 50자 이하로 등록해주세요'),
    body('wr_content')
    .trim()
    .exists()
    .isLength({min:2, max:50})
    .withMessage('내용은 최소 2자 이상 10,000자 이하로 등록해주세요'),
];

export {schema as writeSchema};