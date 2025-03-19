import React, { useState, useMemo, useEffect, useRef } from 'react';
import Input from './input';

function createFilter<T extends object>(
    searchTerm: string,
    filterKeys: Array<keyof T | string>
): (item: T, index: number) => boolean {
    const lowerSearch = searchTerm.trim().toLowerCase();
    const searchAsNumber = Number(lowerSearch);
    const isNumberSearch = !isNaN(searchAsNumber) && lowerSearch !== '';

    // 判断是否需要启用索引搜索
    const enableIndexSearch = filterKeys.includes('#index') && isNumberSearch;

    return (item: T, index: number): boolean => {
        if (lowerSearch === '') return true;

        // 常规属性匹配
        const propertyMatch = filterKeys.some(key => {
            if (key === '#index') return false; // 跳过索引标识符
            const value = getNestedProperty(item, String(key));
            return isValueMatching(value, lowerSearch);
        });

        // 索引匹配（仅当启用且输入为有效数字时）
        const indexMatch = enableIndexSearch && (index === searchAsNumber);

        return propertyMatch || indexMatch;
    };
}

// 增强的类型判断匹配逻辑
function isValueMatching(value: unknown, search: string): boolean {
    if (value == null) return false; // 排除 null/undefined

    // 处理数字类型直接匹配
    if (typeof value === 'number') {
        return (
            String(value) === search || // 精确数字字符串匹配
            value.toString().toLowerCase().includes(search) || // 数字包含匹配
            (search === '' && !isNaN(value)) // 空搜索匹配所有有效数字
        );
    }

    // 其他类型转为字符串匹配
    return String(value).toLowerCase().includes(search);
}

// 安全获取嵌套属性（支持泛型对象）
function getNestedProperty<T>(obj: T, path: string): unknown {
    return path.split('.').reduce((acc: any, part) => acc?.[part], obj);
}

type SearchInputProps<T extends object> = {
    items: T[];
    filterKeys: Array<keyof T | string | '#index'>;
    itemComponent: ({ item, index }: { item: T; index: number }) => React.ReactNode;
    placeholder?: string;
    className?: string;
    emptyMessage?: React.ReactNode;
    initialValue?: string;
    resultKey?: keyof T;
    onResultClick?: (item: T) => void;
};

export function SearchInput<T extends object>({
    items,
    filterKeys,
    itemComponent: ItemComponent,
    placeholder = 'Search...',
    className = '',
    emptyMessage = 'No results found',
    initialValue = '',
    resultKey,
    onResultClick,
}: SearchInputProps<T>) {

    const containerRef = useRef<HTMLDivElement>(null);

    const [searchTerm, setSearchTerm] = useState(initialValue);
    // const [debouncedSearch, setDebouncedSearch] = useDebounceValue(searchTerm, 300);

    // useEffect(() => {
    //     setDebouncedSearch(searchTerm);
    // }, [searchTerm]);

    const [resultVisible, setResultVisible] = useState(false)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setResultVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 在 useMemo 中使用 debouncedSearch
    const filteredItems = useMemo(() => {
        const filter = createFilter<T>(searchTerm, filterKeys);
        // 传递 index 给过滤函数
        return items
            .map((item, index) => ({ item, index }))
            .filter(({ item, index }) => filter(item, index))
            .map(({ item }) => item);
    }, [items, searchTerm, filterKeys]);

    // 处理结果点击
    const handleResultClick = (item: T) => {
        if (resultKey) {
            const value = String(item[resultKey]);
            setSearchTerm(value);
        }
        setResultVisible(false);
        onResultClick?.(item);
    };

    const handleInputChange = (val: string) => {
        setSearchTerm(val);
        setResultVisible(val !== '');
    };

    return (
        <div className={`search-container ${className}`}>
            <Input
                inputProps={{
                    onFocus: () => searchTerm && setResultVisible(true),
                }}
                value={searchTerm}
                onChange={handleInputChange}
                placeholder={placeholder}
            />
            {resultVisible && (
                <div className="absolute z-10 w-48 bg-white border border-gray-300 rounded-md shadow-md mt-1 overflow-y-scroll max-h-48">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => handleResultClick(item)}
                                className="hover:cursor-pointer"
                            >
                                {React.isValidElement(ItemComponent) ? (
                                    React.cloneElement(ItemComponent, {
                                        item,
                                    } as React.Attributes & { item: T })
                                ) : (
                                    <ItemComponent item={item} index={index} />
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">{emptyMessage}</div>
                    )}
                </div>
            )}
        </div>
    );
}