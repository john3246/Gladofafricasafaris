const { validateInquiry } = require('./inquiry.validator');
const repo = require('./inquiry.repository');
const { buildMeta } = require('../../seo/meta');

exports.submit = async (req, res) => {
  const { data, errors } = validateInquiry(req.body);

  if (errors) {
    res.locals.seo = buildMeta({ title: 'Contact Us', description: 'Get a free Tanzania safari quote.', noindex: true });
    return res.status(422).render('inquiry/views/contact', { errors, values: req.body });
  }
  if (!data.website) await repo.save(data);

  res.locals.seo = buildMeta({ title: 'Thank You', description: 'We received your safari request.', noindex: true });
  res.render('inquiry/views/thanks', { name: data.name });
};
