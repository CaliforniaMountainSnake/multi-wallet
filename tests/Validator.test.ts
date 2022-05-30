import {validate} from "../src/validation/Validator";

const promisesGenerator = {
    num: async (): Promise<number> => {
        return 133;
    },
    bool: async (): Promise<boolean> => {
        return true;
    },
    str: async (): Promise<string> => {
        return "test";
    },
    err: async (text: string): Promise<string> => {
        throw new Error(text);
    },
};

test("onSuccess test", () => {
    validate({
        first: promisesGenerator.num(),
        second: promisesGenerator.str(),
        third: promisesGenerator.bool(),
    }, validatedData => {
        expect(validatedData).toEqual({
            first: 133,
            second: "test",
            third: true,
        });
    }, () => {
        throw new Error("invalid");
    });
});

test("onError test", () => {
    validate({
        first: promisesGenerator.num(),
        second: promisesGenerator.err("some error"),
        third: promisesGenerator.bool(),
        fourth: promisesGenerator.err("another error"),
    }, () => {
        throw new Error("invalid");
    }, validationErrors => {
        expect(validationErrors).toEqual({
            secondError: new Error("some error"),
            fourthError: new Error("another error"),
        });
    });
});

test("empty input test", () => {
    validate({}, validatedData => {
        expect(validatedData).toEqual({});
    }, () => {
        throw new Error("invalid");
    });
});
