// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "../components/common/StatCard";

describe("StatCard 组件", () => {
  it("渲染标签和数值", () => {
    render(<StatCard label="知识总量" value={42} />);
    expect(screen.getByText("知识总量")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("不传 sub 时不渲染副文本", () => {
    const { container } = render(<StatCard label="用户数" value={100} />);
    const textElements = container.querySelectorAll(".text-xs");
    expect(textElements.length).toBe(0);
  });

  it("传了 sub 时显示副文本", () => {
    render(<StatCard label="空间数量" value={5} sub="3个自动发布" />);
    expect(screen.getByText("3个自动发布")).toBeInTheDocument();
  });

  it("支持 colorClass 自定义颜色", () => {
    const { container } = render(
      <StatCard label="待审核" value={8} colorClass="text-warning" />
    );
    const valueEl = container.querySelector(".text-warning");
    expect(valueEl).toBeInTheDocument();
    expect(valueEl?.textContent).toBe("8");
  });

  it("value 为 0 时正常显示", () => {
    render(<StatCard label="今日更新" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("value 为字符串时正常显示", () => {
    render(<StatCard label="完成率" value="85%" />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });
});
