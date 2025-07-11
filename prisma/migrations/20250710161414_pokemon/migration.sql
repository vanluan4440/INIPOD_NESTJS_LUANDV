-- CreateTable
CREATE TABLE "pokemons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type1" TEXT NOT NULL,
    "type2" TEXT,
    "total" INTEGER NOT NULL,
    "hp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "spAttack" INTEGER NOT NULL,
    "spDefense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "generation" INTEGER NOT NULL,
    "legendary" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT NOT NULL,
    "ytbUrl" TEXT NOT NULL,

    CONSTRAINT "pokemons_pkey" PRIMARY KEY ("id")
);
