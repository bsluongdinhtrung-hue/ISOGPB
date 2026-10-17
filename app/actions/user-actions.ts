"use server";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { UserProfile, UserRole } from "@/types/iso";
import bcrypt from "bcryptjs";

/**
 * Sinh mật khẩu tạm ngẫu nhiên an toàn (10 ký tự gồm chữ hoa, thường, số)
 */
function generateSecureTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

/**
 * Cán bộ nhân viên tự đổi mật khẩu (bắt buộc khi đăng nhập lần đầu)
 */
export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, message: "Bạn chưa đăng nhập." };
  }

  if (!newPassword || newPassword.trim().length < 6) {
    return { success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }

  const emailLower = session.user.email.toLowerCase();

  try {
    const { data: userData, error: fetchErr } = await supabaseAdmin
      .from("iso_users")
      .select("*")
      .eq("id", emailLower)
      .single();

    if (fetchErr || !userData) {
      return { success: false, message: "Không tìm thấy thông tin tài khoản." };
    }

    const storedPassword = userData.password;
    if (!storedPassword || typeof storedPassword !== "string") {
      return { success: false, message: "Tài khoản chưa được thiết lập mật khẩu." };
    }

    let isCurrentValid = false;
    if (storedPassword.startsWith("$2")) {
      isCurrentValid = await bcrypt.compare(currentPassword.trim(), storedPassword);
    } else {
      isCurrentValid = (currentPassword.trim() === storedPassword);
    }

    if (!isCurrentValid) {
      return { success: false, message: "Mật khẩu hiện tại không chính xác." };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword.trim(), 10);

    const { error: updateErr } = await supabaseAdmin
      .from("iso_users")
      .update({
        password: hashedNewPassword,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailLower);

    if (updateErr) throw updateErr;

    revalidatePath("/", "layout");
    return { success: true, message: "Đổi mật khẩu thành công!" };
  } catch (error: any) {
    console.error("Error changing password:", error);
    return { success: false, message: error.message || "Lỗi khi cập nhật mật khẩu." };
  }
}

/**
 * Trưởng khoa / Admin thêm nhân viên mới
 */
export async function createUser(data: {
  fullName: string;
  email: string;
  role: UserRole;
  title: string;
  phone?: string;
  initialPassword?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = data.email.trim().toLowerCase();
  if (!emailLower || !emailLower.includes("@")) {
    return { success: false, message: "Email không hợp lệ." };
  }

  if (!data.fullName?.trim()) {
    return { success: false, message: "Họ và tên không được để trống." };
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from("iso_users")
      .select("id")
      .eq("id", emailLower)
      .single();

    if (existing) {
      return { success: false, message: "Email này đã tồn tại trong danh sách nhân sự." };
    }

    const tempPassword = data.initialPassword?.trim() || generateSecureTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const nowIso = new Date().toISOString();
    const { error: insertErr } = await supabaseAdmin.from("iso_users").insert({
      id: emailLower,
      email: emailLower,
      full_name: data.fullName.trim(),
      role: data.role || "USER",
      title: data.title.trim() || (data.role === "ADMIN" ? "Trưởng khoa / Admin" : "Kỹ thuật viên"),
      phone: data.phone?.trim() || "",
      password: hashedPassword,
      must_change_password: data.role === "ADMIN" ? false : true,
      active: true,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (insertErr) throw insertErr;

    revalidatePath("/admin/users");
    revalidatePath("/assignment");
    revalidatePath("/");
    return { 
      success: true, 
      message: `Đã thêm nhân viên mới thành công! Mật khẩu tạm ban đầu: ${tempPassword}`,
      tempPassword,
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, message: error.message || "Lỗi khi thêm nhân viên." };
  }
}

/**
 * Trưởng khoa / Admin sửa thông tin nhân viên
 */
export async function updateUser(
  email: string,
  data: {
    fullName: string;
    role: UserRole;
    title: string;
    phone?: string;
  }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = email.trim().toLowerCase();

  try {
    const { error: updateErr } = await supabaseAdmin
      .from("iso_users")
      .update({
        full_name: data.fullName.trim(),
        role: data.role,
        title: data.title.trim(),
        phone: data.phone?.trim() || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailLower);

    if (updateErr) throw updateErr;

    revalidatePath("/admin/users");
    revalidatePath("/assignment");
    revalidatePath("/");
    return { success: true, message: "Cập nhật thông tin nhân viên thành công!" };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return { success: false, message: error.message || "Lỗi khi cập nhật thông tin." };
  }
}

/**
 * Vô hiệu hóa hoặc Kích hoạt lại tài khoản
 */
export async function toggleUserStatus(email: string, active: boolean) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = email.trim().toLowerCase();

  // Không cho phép tự vô hiệu hóa tài khoản của chính mình
  if (session.user.email?.toLowerCase() === emailLower && !active) {
    return { success: false, message: "Bạn không thể tự vô hiệu hóa tài khoản của chính mình." };
  }

  try {
    const { error: updateErr } = await supabaseAdmin
      .from("iso_users")
      .update({
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailLower);

    if (updateErr) throw updateErr;

    revalidatePath("/admin/users");
    revalidatePath("/assignment");
    revalidatePath("/");
    return {
      success: true,
      message: active ? "Đã kích hoạt lại tài khoản." : "Đã vô hiệu hóa tài khoản thành công.",
    };
  } catch (error: any) {
    console.error("Error toggling user status:", error);
    return { success: false, message: error.message || "Lỗi khi đổi trạng thái tài khoản." };
  }
}

/**
 * Trưởng khoa / Admin đặt lại mật khẩu cho nhân viên
 */
export async function resetUserPassword(email: string, newTempPassword?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = email.trim().toLowerCase();
  const tempPassword = newTempPassword?.trim() || generateSecureTempPassword();

  try {
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const { error: updateErr } = await supabaseAdmin
      .from("iso_users")
      .update({
        password: hashedPassword,
        must_change_password: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailLower);

    if (updateErr) throw updateErr;

    revalidatePath("/admin/users");
    return {
      success: true,
      message: `Đã đặt lại mật khẩu thành công! Mật khẩu tạm: ${tempPassword}`,
      tempPassword,
    };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, message: error.message || "Lỗi khi đặt lại mật khẩu." };
  }
}

/**
 * Trưởng khoa / Admin xóa tài khoản nhân viên
 */
export async function deleteUser(email: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Bạn không có quyền thực hiện thao tác này." };
  }

  const emailLower = email.trim().toLowerCase();

  // Không cho phép tự xóa tài khoản của chính mình
  if (session.user.email?.toLowerCase() === emailLower) {
    return { success: false, message: "Bạn không thể tự xóa tài khoản của chính mình." };
  }

  try {
    const { error: deleteErr } = await supabaseAdmin
      .from("iso_users")
      .delete()
      .eq("id", emailLower);

    if (deleteErr) throw deleteErr;

    revalidatePath("/admin/users");
    revalidatePath("/assignment");
    revalidatePath("/");
    return { success: true, message: "Đã xóa nhân viên khỏi hệ thống thành công." };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: error.message || "Lỗi khi xóa nhân viên." };
  }
}
