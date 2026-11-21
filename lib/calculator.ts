/** Bounded recursive-descent arithmetic parser. No dynamic code execution. */
export function calculate(expression: string): number {
  if (!expression.trim() || expression.length > 500)
    throw new Error("Enter an expression of 1–500 characters.");
  const source = expression.replace(/\*\*/g, "^");
  const tokens = source.match(/(?:\d*\.\d+|\d+\.?\d*)|[+\-*/%^()]|\S/g) || [];
  let index = 0;
  function atom(): number {
    const token = tokens[index++];
    if (token === "(") {
      const value = sum();
      if (tokens[index++] !== ")") throw new Error("Unmatched parenthesis.");
      return value;
    }
    if (!token || !/^(?:\d*\.\d+|\d+\.?\d*)$/.test(token))
      throw new Error("Invalid expression.");
    return Number(token);
  }
  function power(): number {
    const left = atom();
    if (tokens[index] === "^") {
      index++;
      return left ** unary();
    }
    return left;
  }
  function unary(): number {
    if (tokens[index] === "+") {
      index++;
      return unary();
    }
    if (tokens[index] === "-") {
      index++;
      return -unary();
    }
    return power();
  }
  function product(): number {
    let value = unary();
    while (["*", "/", "%"].includes(tokens[index])) {
      const op = tokens[index++];
      const right = unary();
      value =
        op === "*" ? value * right : op === "/" ? value / right : value % right;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (["+", "-"].includes(tokens[index])) {
      const op = tokens[index++];
      const right = product();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }
  const result = sum();
  if (index !== tokens.length || !Number.isFinite(result))
    throw new Error("Invalid expression or non-finite result.");
  return result;
}
