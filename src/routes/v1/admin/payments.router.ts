import { validateSchema } from "@middleware/ValidateSchema";
import { PaymentService } from "@services/payments.service";
import { Router } from "express";
import Joi from "joi";

const paymentService = new PaymentService();
const router = Router();
export default function () {
  router.get('/plans', async (req, res) => res.json(await paymentService.plans()));
  router.post('/plans', validateSchema(Joi.object({
    name: Joi.string().required(),
    // interval: Joi.
  }).required()), async (req, res) => res.json(await paymentService.createPlans(req.body)));

  return router;
}