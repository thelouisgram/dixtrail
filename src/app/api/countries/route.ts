import { Role } from "@prisma/client";
import { withAuth, withRole } from "@/lib/api-route";
import { jsonOk } from "@/lib/api-response";
import { createCountrySchema } from "@/lib/validations";
import { createCountry, getCountries } from "@/services/countries.service";

export const GET = withAuth(async () => {
  const countries = await getCountries();
  return jsonOk(countries);
});

export const POST = withRole([Role.ADMIN, Role.MANAGER], async (request) => {
  const body = await request.json();
  const { name } = createCountrySchema.parse(body);
  const country = await createCountry(name);
  return jsonOk(country, 201);
});
