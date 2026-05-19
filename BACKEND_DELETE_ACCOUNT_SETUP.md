// Add this route to your auth routes file (routes/authRoutes.js)
// This endpoint allows users to delete their own account by deactivating it

router.put('/profile/:uid/delete', authController.deleteUserAccount);

// ============================================
// In your authController.js, add this function:
// ============================================

const deleteUserAccount = async (req, res) => {
  const { uid } = req.params;
  const { id } = req.body; // Get user id from body or query
  
  try {
    // Get user by UID to find their ID
    const [users] = await db.query('SELECT id FROM users WHERE uid = ?', [uid]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = users[0].id;

    // Deactivate the account by setting active = 0
    await db.query('UPDATE users SET active = 0 WHERE uid = ?', [uid]);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Error deleting account", error: err.message });
  }
};

// ============================================
// IMPORTANT: The frontend calls PUT /auth/users/:id/status
// This already exists in your backend code as toggleUserStatus
// So the endpoint should already work!
// ============================================
