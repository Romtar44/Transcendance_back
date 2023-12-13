export const jwtConstants = {
	secret: process.env.JWTSECRET,
};

export interface JwtPayload {
	email: string
	sub: string,
	isTfaEnable?: boolean
	isTfaAuthentificated?: boolean
}
