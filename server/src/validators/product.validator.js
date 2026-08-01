const { z } = require('zod');

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Category is required"),
  dailyRent: z.string().transform(val => parseFloat(val)).refine(val => !isNaN(val) && val > 0, "Daily rent must be a positive number"),
  location: z.string().min(3, "Location is required"),
  quantity: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val) && val > 0, "Quantity must be at least 1"),
  condition: z.string().min(2, "Condition is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
});

module.exports = {
  productSchema
};
