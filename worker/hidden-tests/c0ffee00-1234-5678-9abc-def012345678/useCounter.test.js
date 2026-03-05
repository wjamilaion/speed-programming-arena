import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter Hidden Tests", () => {
    test("should use initial value", () => {
        const { result } = renderHook(() => useCounter(10));
        expect(result.current.count).toBe(10);
    });

    test("should use default initial value of 0", () => {
        const { result } = renderHook(() => useCounter());
        expect(result.current.count).toBe(0);
    });

    test("should increment by 1", () => {
        const { result } = renderHook(() => useCounter(0));
        act(() => {
            result.current.increment();
        });
        expect(result.current.count).toBe(1);
    });

    test("should decrement by 1", () => {
        const { result } = renderHook(() => useCounter(5));
        act(() => {
            result.current.decrement();
        });
        expect(result.current.count).toBe(4);
    });

    test("should not decrement below 0", () => {
        const { result } = renderHook(() => useCounter(0));
        act(() => {
            result.current.decrement();
        });
        expect(result.current.count).toBe(0);
    });

    test("should reset to initial value", () => {
        const { result } = renderHook(() => useCounter(10));
        act(() => {
            result.current.increment();
            result.current.reset();
        });
        expect(result.current.count).toBe(10);
    });
});
