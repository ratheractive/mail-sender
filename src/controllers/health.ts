import express from 'express'
import config from '../config';

export const healthController = (app: express.Express) => {
  app.get('/health', (req, res) => {
    res.status(200).json({
      "status": "ok",
      "version": config.VERSION
    })
  });
}