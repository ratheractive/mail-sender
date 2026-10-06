# mail sender

This is a very simple post api which allows you to send emails to one specific address. It was built with contact web forms in mind. You can simply integrate it with the html form post url and receive emails from your web site visitors. The visitors will also receive a confirmation that you got their email.

## Features

* SMTP delivery
* form data and json are supported as content
* both receive confirmation email and the smtp forward emails are templatable
* `CORS_ORIGINS` is `*` (the default) or a comma-separated list of exact origins
* `GET /health` answers `{"status":"ok","version":"<release tag>"}`, so you can tell which build is running

## Spam protection

Both checks are off unless configured. A submission that fails one gets the same `200` and
response body as a delivered one, so a bot learns nothing, and no email is sent.

* `HONEYPOT_FIELD` - name of a field the form hides from people (off-screen, `aria-hidden`,
  `tabindex="-1"`, `autocomplete="off"`). It must be present and empty: filled means a bot
  completed it, missing means a bot posted only the visible fields straight to this endpoint.
* `MIN_SUBMIT_SECONDS` - the form sends `elapsed_ms`, the time since it was shown; anything
  faster, or without it, is dropped. Measured by the page, so client clock skew does not matter.

The confirmation email goes to whatever address the visitor typed, so it repeats nothing else
they typed: otherwise anyone could use the form to deliver their own text to a third party.
`CONFIRMATION_SUBJECT` and `CONFIRMATION_TEMPLATE` are rendered with `from` (that same address)
alone, and the service refuses to start if either uses `name`, `subject` or `message`.

## TO DO IN THE FUTURE

* security
* request throtling
* gmail and other providers integration as transport
* i18n support
* custom responses