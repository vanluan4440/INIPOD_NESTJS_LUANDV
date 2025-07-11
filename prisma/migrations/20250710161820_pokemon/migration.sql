-- CreateTable
CREATE TABLE "user_pokemons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pokemonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pokemons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_pokemons_userId_pokemonId_key" ON "user_pokemons"("userId", "pokemonId");

-- AddForeignKey
ALTER TABLE "user_pokemons" ADD CONSTRAINT "user_pokemons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pokemons" ADD CONSTRAINT "user_pokemons_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
