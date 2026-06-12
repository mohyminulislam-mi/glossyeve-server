const express = require("express");
const router = express.Router();

router.get("/test-bypass", (req, res) => {
  return res.send("Express routing is working perfectly!");
});

const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").get(getCart).post(addItem).delete(clearCart);

router.route("/:id").put(updateItem).delete(removeItem);

module.exports = router;
