const express = require("express");
const router = express.Router();

// Import your models
const { User, Address, UserAddress } = require("../models");
// Middleware that ensures req.user is populated
const { validateToken } = require("../middlewares/auth");

// EXAMPLE: If you want some validation library
// const yup = require("yup");

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: All endpoints below require auth (via validateToken)
// so the user only sees/manages their own addresses.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/addresses
 * Retrieve all addresses for the logged-in user
 */
router.get("/", validateToken, async (req, res) => {
  try {
    // Find the user and eagerly load the addresses
    // Or you can do: user.getAddresses({ ...include pivot... })
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Address,
          through: {
            attributes: ["isDefault"], // include pivot column(s)
          },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // user.Addresses is an array of Address instances
    // each with `.UserAddress.isDefault`
    const addresses = user.Addresses.map((addr) => ({
      address_id: addr.address_id,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      // from pivot table
      isDefault: addr.UserAddress.isDefault,
    }));

    res.json(addresses);
  } catch (error) {
    console.error("Error fetching user's addresses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/addresses/:id
 * Retrieve a single address for the logged-in user by address ID
 */
router.get("/:id", validateToken, async (req, res) => {
  try {
    const addressId = req.params.id;

    // We want to ensure that the address belongs to this user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Try to get the specific address via the user association
    // This ensures only addresses belonging to the user can be found
    const addresses = await user.getAddresses({
      where: { address_id: addressId },
      joinTableAttributes: ["isDefault"],
    });

    if (addresses.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    const addr = addresses[0];
    // Format response
    const result = {
      address_id: addr.address_id,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.UserAddress.isDefault,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/addresses
 * Create a new address for the logged-in user.
 * The new record is associated to them via the pivot table (UserAddress).
 */
router.post("/", validateToken, async (req, res) => {
  try {
    // Optionally, validate req.body data with your library (yup, joi, etc.)
    // e.g. `await addressSchema.validate(req.body, { abortEarly: false });`

    // Create the address itself
    const newAddress = await Address.create({
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
    });

    // Link it to the user via pivot table, including isDefault if needed
    const isDefault = req.body.isDefault === true;
    // (some logic: if you want to automatically set all others false, do so)

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add through pivot data
    await user.addAddress(newAddress, { through: { isDefault } });

    // Return the newly created address
    res.status(201).json({
      ...newAddress.get(),
      isDefault: isDefault,
    });
  } catch (error) {
    console.error("Error creating address:", error);
    res
      .status(400)
      .json({ message: "Invalid address data", error: error.message });
  }
});

/**
 * PUT /api/addresses/:id
 * Update an existing address that belongs to the logged-in user
 */
router.put("/:id", validateToken, async (req, res) => {
  try {
    const addressId = req.params.id;
    const user = await User.findByPk(req.user.id);

    // Check user existence
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the address if it belongs to the user
    const addresses = await user.getAddresses({
      where: { address_id: addressId },
    });
    if (addresses.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    // There's only one match
    const address = addresses[0];
    // Update the Address table columns
    await address.update({
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
    });

    // If we also want to update the pivot's isDefault
    if (req.body.hasOwnProperty("isDefault")) {
      const pivot = await UserAddress.findOne({
        where: {
          user_id: user.id,
          address_id: address.address_id,
        },
      });
      if (!pivot) {
        return res.status(404).json({ message: "Pivot/association not found" });
      }
      await pivot.update({ isDefault: !!req.body.isDefault });
    }

    res.json({ message: "Address updated", address });
  } catch (error) {
    console.error("Error updating address:", error);
    res
      .status(400)
      .json({ message: "Invalid address data", error: error.message });
  }
});

/**
 * DELETE /api/addresses/:id
 * Delete an address from the database (and the pivot).
 * OR remove only the association, depending on your business logic.
 */
router.delete("/:id", validateToken, async (req, res) => {
  try {
    const addressId = req.params.id;
    const user = await User.findByPk(req.user.id);

    // Check user existence
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Make sure the address belongs to them
    const addresses = await user.getAddresses({
      where: { address_id: addressId },
    });
    if (addresses.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    // At this point, we can either:
    // 1) physically remove the address record
    // 2) or remove just the pivot association if multiple users could share the same address

    // If only the user uses the address, physically remove from DB:
    const address = addresses[0];
    await address.destroy();

    // Alternatively, if you wanted to remove the association only:
    // await user.removeAddress(address);

    res.status(204).json({ message: "Address deleted!" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * PATCH /api/addresses/:id/isDefault
 * Patch 'isDefault' in pivot row for the user's address
 */
router.patch("/:id/isDefault", validateToken, async (req, res) => {
  try {
    const addressId = req.params.id;
    const newIsDefault = !!req.body.isDefault; // coerce to boolean

    // 1) Confirm user & address association
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addresses = await user.getAddresses({
      where: { address_id: addressId },
    });
    if (addresses.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }
    const address = addresses[0];

    // 2) Update the pivot
    const pivot = await UserAddress.findOne({
      where: { user_id: user.id, address_id: address.address_id },
    });
    if (!pivot) {
      return res.status(404).json({ message: "Pivot row not found" });
    }

    // Possibly unset isDefault for other addresses
    // if you want only one default at a time
    if (newIsDefault) {
      await UserAddress.update(
        { isDefault: false },
        { where: { user_id: user.id } }
      );
    }

    await pivot.update({ isDefault: newIsDefault });

    res.json({
      message: `Address ${addressId} isDefault set to ${newIsDefault}`,
    });
  } catch (error) {
    console.error("Error updating isDefault:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
