import { registerSchema } from "./schemas";

const valid = {
  firstName: "Alice",
  lastName: "Martin",
  email: "alice@test.com",
  password: "Password1!",
  confirmPassword: "Password1!",
};

const errorsOf = (values: typeof valid) => {
  const result = registerSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("registerSchema", () => {
  it("accepte un mot de passe conforme aux règles de l'API", () => {
    expect(errorsOf(valid)).toEqual([]);
  });

  it("liste chaque règle de mot de passe non respectée", () => {
    const errors = errorsOf({ ...valid, password: "abc", confirmPassword: "abc" });

    expect(errors).toEqual(
      expect.arrayContaining(["8 caractères minimum", "Une majuscule", "Un chiffre"]),
    );
  });

  it("refuse une confirmation différente", () => {
    expect(errorsOf({ ...valid, confirmPassword: "Password2!" })).toContain(
      "Les mots de passe ne correspondent pas",
    );
  });

  it("refuse un caractère spécial que l'API n'accepte pas", () => {
    expect(errorsOf({ ...valid, password: "Password1_", confirmPassword: "Password1_" })).toEqual(
      expect.arrayContaining([expect.stringContaining("caractère spécial")]),
    );
  });
});
