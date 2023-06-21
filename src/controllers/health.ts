import express from 'express'

export const healthController = (app: express.Express) => {
  app.get('/health', (req, res) => {
    res.status(200).json({
      "status": "ok"
    })
  });
}