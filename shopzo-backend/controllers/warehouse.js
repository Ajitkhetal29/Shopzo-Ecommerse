import Warehouse from "../models/warehouse.js";
import User from "../models/user.js";
import Role from "../models/role.js";
import Department from "../models/department.js";

export const createWarehouse = async (req, res) => {
  try {
    const { name, contactNumber, location, address, members } = req.body;

    if (
      !name ||
      !contactNumber ||
      !location?.lat ||
      !location?.lng ||
      !address?.formatted ||
      !address?.state ||
      !address?.city ||
      !address?.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Required warehouse data missing",
      });
    }

    const warehouse = await Warehouse.create({
      name,
      contactNumber,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      address: {
        formatted: address.formatted,
        state: address.state,
        city: address.city,
        pincode: address.pincode,
        landmark: address.landmark || undefined,
      },
      members: members || [],
      createdBy: req.user.id,
    });

    const populatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate("members.user", "name email")
      .populate("members.role", "name code")
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      warehouse: populatedWarehouse,
    });
  } catch (error) {
    console.error("Create warehouse error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true })
      .populate("members.user", "name email department role")
      .populate("members.role", "name code")
      .populate("createdBy", "name email")
      .populate({
        path: "members.user",
        populate: {
          path: "department role",
          select: "name code",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      warehouses,
    });
  } catch (error) {
    console.error("Get warehouses error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactNumber, location, address, isActive, members } = req.body;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    if (name) warehouse.name = name;
    if (contactNumber) warehouse.contactNumber = contactNumber;

    // Validate and update location
    if (location) {
      if (location.lat === undefined || location.lng === undefined) {
        return res.status(400).json({
          success: false,
          message: "Location must include both lat and lng",
        });
      }
      warehouse.location = {
        lat: location.lat,
        lng: location.lng,
      };
    }

    // Validate and update address
    if (address) {
      if (address.formatted && address.state && address.city && address.pincode) {
        warehouse.address = {
          formatted: address.formatted,
          state: address.state,
          city: address.city,
          pincode: address.pincode,
          landmark: address.landmark || warehouse.address?.landmark || undefined,
        };
      } else {
        // Partial update - merge with existing
        warehouse.address = {
          ...warehouse.address,
          ...address,
        };
      }
    }

    if (typeof isActive === "boolean") {
      warehouse.isActive = isActive;
    }

    // Validate and update members
    if (members !== undefined) {
      if (!Array.isArray(members)) {
        return res.status(400).json({
          success: false,
          message: "Members must be an array",
        });
      }

      // Validate all members
      const buyerDepartment = await Department.findOne({ name: { $regex: /^buyer$/i } });
      
      for (const member of members) {
        if (!member.user || !member.role) {
          return res.status(400).json({
            success: false,
            message: "Each member must have user and role",
          });
        }

        // Validate user exists and is not from buyer department
        const user = await User.findById(member.user);
        if (!user || !user.isActive) {
          return res.status(400).json({
            success: false,
            message: `User ${member.user} not found or inactive`,
          });
        }

        if (buyerDepartment && user.department.toString() === buyerDepartment._id.toString()) {
          return res.status(400).json({
            success: false,
            message: "Cannot add buyer department users to warehouse",
          });
        }

        // Validate role exists and is active
        const role = await Role.findById(member.role);
        if (!role || !role.isActive) {
          return res.status(400).json({
            success: false,
            message: `Role ${member.role} not found or inactive`,
          });
        }

        // Validate role belongs to user's department
        if (role.department.toString() !== user.department.toString()) {
          return res.status(400).json({
            success: false,
            message: `Role does not belong to user's department`,
          });
        }
      }

      warehouse.members = members;
    }

    await warehouse.save();

    const populatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate("members.user", "name email")
      .populate("members.role", "name code")
      .populate("createdBy", "name email")
      .populate({
        path: "members.user",
        populate: {
          path: "department role",
          select: "name code",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      warehouse: populatedWarehouse,
    });
  } catch (error) {
    console.error("Update warehouse error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    // Soft delete
    warehouse.isActive = false;
    await warehouse.save();

    return res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
    });
  } catch (error) {
    console.error("Delete warehouse error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addWarehouseMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Role ID are required",
      });
    }

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    // Check if user already exists in members
    const existingMember = warehouse.members.find(
      (m) => m.user.toString() === userId
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User already exists in warehouse members",
      });
    }

    warehouse.members.push({
      user: userId,
      role: roleId,
    });

    await warehouse.save();

    const populatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate("members.user", "name email")
      .populate("members.role", "name code");

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      warehouse: populatedWarehouse,
    });
  } catch (error) {
    console.error("Add warehouse member error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const removeWarehouseMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    warehouse.members = warehouse.members.filter(
      (m) => m._id.toString() !== memberId
    );

    await warehouse.save();

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove warehouse member error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: "Vendor not found",
      });
    }
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = generateToken({ id: vendor._id, name: vendor.name });
   
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "  successfull",
      token
    });

  } catch (error) {
    console.error("Vendor login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const vendorLogout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "logout successfully",
    });
  } catch (error) {
    console.error("Vendor logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const vendorMe = async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = verifyToken(token);
    const vendor = await Vendor.findById(decoded.id);
    return res.status(200).json({
      success: true,
      message: "Vendor me successfully",
    });
  } catch (error) {
    console.error("Vendor me error:", error);
  }
};

