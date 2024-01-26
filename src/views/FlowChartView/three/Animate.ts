/**
 * 使用 观察者模式，配合 Base 实例 animate 的动画属性
 */
export class Animate {
  oType: {[key: string]: CB[]}  = {
    __default__: []
  };

  add(fn: CB): void;
  add(type: string, fn: CB): void;
  add(a: string | CB, fn?: CB) {
    if (typeof a === 'function') {
      this.oType.__default__.push(a);
    }
    if (typeof a === 'string' && typeof fn === 'function') {
      this.oType[a] = this.oType[a] || [];
      this.oType[a].push(fn);
    }
  }

  remove(fn: CB): void;
  remove(type: string): void;
  remove(type: string, fn: CB): void;
  remove(a: string | CB, fn?: CB) {
    if (typeof a === 'function') {
      this.oType.__default__ = this.oType.__default__.filter(item => item !== a);
    }

    if (typeof a === 'string' && !fn) {
      this.oType[a] = [];
    }

    if (typeof a === 'string' && typeof fn === 'function') {
      this.oType[a] = this.oType[a] || [];
      this.oType[a] = this.oType[a].filter(item => item !== fn);
    }
  }
}


interface CB {
  (time: number): void
}

