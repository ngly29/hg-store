import styles from "./page.module.css";

export interface Column<T> {
    key?: keyof T;
    title: string;
    render?: (item: T, index: number) => React.ReactNode;
    width?: number;
}

interface DataTableProps<T> {
    data: T[],
    columns: Column<T>[];
}

export default function Table<T>({data, columns}: DataTableProps<T>){
    return (
        <div className={styles.table}>
            <table>
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={column.key
                                        ? String(column.key)
                                        : `col-${index}`} style={{ width: column.width }}>
                                {column.title}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.map((item, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((column, colIndex) => (
                                <td key={column.key
                                            ? String(column.key)
                                            : `col-${colIndex}`}>
                                    {column.render
                                        ? column.render(item, rowIndex)
                                        : column.key
                                            ? String(item[column.key])
                                            : null
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}