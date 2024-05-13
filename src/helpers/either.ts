type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
// eslint-disable-next-line @typescript-eslint/ban-types
type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

type Left<T> = {
    left: T;
    right?: never;
};

type Right<U> = {
    left?: never;
    right: U;
};

export class Either<T, U> {
    left: T;

    right: U;

    private constructor({ left, right }: Left<T> | Right<U>) {
        if (left) {
            this.left = left;
        } else if (right) {
            this.right = right;
        }
    }

    static makeLeft<T>(value: T): Either<T, never> {
        return new Either({ left: value });
    }

    static makeRight<U>(value: U): Either<never, U> {
        return new Either({ right: value });
    }

    isLeft(): this is Either<T, never> {
        return 'left' in this && this.left !== undefined;
    }

    isRight(): this is Either<never, U> {
        return 'right' in this && this.right !== undefined;
    }

    unwrap(): XOR<T, U> {
        if (this.isLeft()) {
            return this.left as NonNullable<T>;
        }
        if (this.isRight()) {
            return this.right as NonNullable<U>;
        }
        throw new Error(`Received no left or right values at runtime when opening Either`);
    }
}
