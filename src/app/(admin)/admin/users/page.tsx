"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { userApi } from "@/lib/userApi";
import { UserResponse } from "@/types/user";
import styles from "./page.module.css";

const roleLabel: Record<string, string> = {
    ADMIN: "Quản trị viên",
    USER: "Người dùng",
};

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const {
        data: users = [],
        isLoading,
        isError,
    } = useQuery<UserResponse[]>({
        queryKey: ["users"],
        queryFn: userApi.getAll,
    });

    const filteredUsers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        if (!keyword) return users;

        return users.filter((user) => {
            const fullName = user.fullName?.toLowerCase() ?? "";
            const email = user.email?.toLowerCase() ?? "";
            const phone = user.phone?.toLowerCase() ?? "";
            const role = roleLabel[user.role]?.toLowerCase() ?? "";

            return fullName.includes(keyword) || email.includes(keyword) || phone.includes(keyword) || role.includes(keyword);
        });
    }, [users, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div>
                    <p className={styles.eyebrow}>Quản lý</p>
                    <h1 className={styles.title}>Người dùng</h1>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Tìm theo tên, email, SĐT, vai trò"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className={styles.emptyState}>Đang tải người dùng...</div>
                ) : isError ? (
                    <div className={styles.emptyState}>Không thể tải danh sách người dùng.</div>
                ) : filteredUsers.length === 0 ? (
                    <div className={styles.emptyState}>Chưa có người dùng nào.</div>
                ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>Họ tên</th>
                                        <th>Email</th>
                                        <th>Số điện thoại</th>
                                        <th>Vai trò</th>
                                        <th>Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedUsers.map((user, index) => (
                                        <tr key={user.id}>
                                            <td>{(safePage - 1) * pageSize + index + 1}</td>
                                            <td className={styles.nameCell}>{user.fullName}</td>
                                            <td>{user.email}</td>
                                            <td>{user.phone || "-"}</td>
                                            <td>
                                                <span className={`${styles.badge} ${user.role === "ADMIN" ? styles.roleAdmin : styles.roleUser}`}>
                                                    {roleLabel[user.role]}
                                                </span>
                                            </td>
                                            <td>
                                                {user.createdAt
                                                    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                                                    : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.paginationBar}>
                            <div className={styles.paginationInfo}>
                                Hiển thị {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredUsers.length)} / {filteredUsers.length} người dùng
                            </div>

                            <div className={styles.paginationControls}>
                                <select
                                    className={styles.pageSizeSelect}
                                    value={pageSize}
                                    onChange={(event) => {
                                        setPageSize(Number(event.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value={5}>5 / trang</option>
                                    <option value={10}>10 / trang</option>
                                    <option value={20}>20 / trang</option>
                                </select>

                                <button
                                    type="button"
                                    className={styles.pageButton}
                                    disabled={safePage === 1}
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                >
                                    Trước
                                </button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        className={`${styles.pageButton} ${item === safePage ? styles.pageButtonActive : ""}`}
                                        onClick={() => setPage(item)}
                                    >
                                        {item}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className={styles.pageButton}
                                    disabled={safePage === totalPages}
                                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
