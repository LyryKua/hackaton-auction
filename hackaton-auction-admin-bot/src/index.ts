const world = 'world';

export function hello(who: string = world): string {
  return `Hello, admin ${who}! `;
}

const greeting = hello();

console.log(greeting);
