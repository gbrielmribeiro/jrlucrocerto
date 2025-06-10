import React, { useState } from "react";
import { motion } from "framer-motion";

const defaultHouse = {
  name: "",
  odd: 2.0,
  stake: 100,
  isLay: false,
  hasCommission: false,
  commission: 0,
  freebet: false,
  oddBoost: 0,
  layStake: 0,
  responsibility: 0,
  profit: 0,
};

function Input({ type = "text", ...props }) {
  return (
    <input
      type={type}
      {...props}
      className="border border-green-700 rounded px-2 py-1 w-full"
    />
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center space-x-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="form-checkbox text-green-700"
      />
      <span>{label}</span>
    </label>
  );
}

function Button({ children, onClick, variant }) {
  let baseClasses =
    "px-4 py-2 rounded font-semibold cursor-pointer select-none";
  let variantClasses =
    variant === "default"
      ? "bg-green-700 text-white hover:bg-green-800"
      : "border border-green-700 text-green-700 hover:bg-green-100";

  return (
    <button className={`${baseClasses} ${variantClasses}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-green-700 rounded px-2 py-1"
    >
      {options.map(({ label, value }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default function ArbitragemCalculator() {
  const [numHouses, setNumHouses] = useState(2);
  const [houses, setHouses] = useState(Array(5).fill({ ...defaultHouse }));
  const [selectedStakeIndex, setSelectedStakeIndex] = useState(0);
  const [totalStake, setTotalStake] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const handleHouseChange = (index, field, value) => {
    const updated = [...houses];
    updated[index] = { ...updated[index], [field]: value };
    setHouses(updated);
  };

  const calculateStakes = () => {
    const baseStake = houses[selectedStakeIndex].stake;
    const adjustedHouses = [...houses];

    const totalInverse = adjustedHouses
      .slice(0, numHouses)
      .reduce((acc, h) => {
        let odd = parseFloat(h.odd) + parseFloat(h.oddBoost || 0);
        if (h.isLay) {
          const commission = h.hasCommission ? h.commission / 100 : 0;
          odd = (odd - 1) * (1 - commission) + 1;
        } else if (h.hasCommission) {
          odd = odd * (1 - h.commission / 100);
        }
        return acc + 1 / odd;
      }, 0);

    let totalStaked = 0;
    let totalReturn = 0;

    const newHouses = adjustedHouses.map((h, i) => {
      if (i >= numHouses) return h;

      let effectiveOdd = parseFloat(h.odd) + parseFloat(h.oddBoost || 0);
      let payout = 0;
      let stake = 0;

      if (h.isLay) {
        const commission = h.hasCommission ? h.commission / 100 : 0;
        effectiveOdd = (effectiveOdd - 1) * (1 - commission) + 1;
        stake = (baseStake / effectiveOdd) / totalInverse;
        payout = stake * (effectiveOdd - 1);
      } else {
        if (h.hasCommission) {
          effectiveOdd = effectiveOdd * (1 - h.commission / 100);
        }
        stake = (baseStake / effectiveOdd) / totalInverse;
        if (h.freebet) {
          payout = stake * (effectiveOdd - 1); // Freebet: lucro líquido
        } else {
          payout = stake * effectiveOdd;
        }
      }

      const totalOtherStakes = adjustedHouses
        .slice(0, numHouses)
        .reduce(
          (sum, cur, idx) => (idx === i ? sum : sum + (parseFloat(cur.stake) || 0)),
          0
        );

      const netProfit = h.freebet ? payout - 0 : payout - totalOtherStakes;
      totalStaked += stake;
      totalReturn = Math.max(totalReturn, payout);

      return {
        ...h,
        stake: parseFloat(stake.toFixed(2)),
        profit: parseFloat(netProfit.toFixed(2)),
      };
    });

    setTotalStake(totalStaked);
    setTotalReturn(totalReturn);
    setTotalProfit(totalReturn - totalStaked);

    setHouses(newHouses);
  };

  React.useEffect(() => {
    calculateStakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numHouses, selectedStakeIndex]);

  return (
    <div className="p-4 max-w-5xl mx-auto font-sans">
      <header className="text-center mb-6">
        <img
          src="/logo-jr-lucro-certo.png"
          alt="JR Lucro Certo"
          className="h-12 mx-auto"
        />
        <h1 className="text-2xl font-bold text-green-800">
          Calculadora de Arbitragem
        </h1>
      </header>

      <div className="mb-4 flex gap-2 justify-center flex-wrap">
        {[2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            variant={n === numHouses ? "default" : "outline"}
            onClick={() => setNumHouses(n)}
          >
            {n} Casas
          </Button>
        ))}
      </div>

      <div className="mb-4 text-center">
        <label className="mr-2 font-medium text-green-800">Stake base:</label>
        <Select
          value={`stake${selectedStakeIndex + 1}`}
          onChange={(val) =>
            setSelectedStakeIndex(Number(val.replace("stake", "")) - 1)
          }
          options={[...Array(numHouses)].map((_, i) => ({
            label: `Stake ${i + 1}`,
            value: `stake${i + 1}`,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {houses.slice(0, numHouses).map((house, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-green-700 rounded bg-green-50 p-4"
          >
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              Casa {i + 1}
            </h2>
            <Input
              placeholder="Nome da Casa"
              value={house.name}
              onChange={(e) => handleHouseChange(i, "name", e.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Odd"
              value={house.odd}
              onChange={(e) =>
                handleHouseChange(i, "odd", parseFloat(e.target.value))
              }
            />
            <Input
              type="number"
              placeholder="Stake"
              value={house.stake}
              onChange={(e) =>
                handleHouseChange(i, "stake", parseFloat(e.target.value))
              }
            />
            <div className="flex items-center space-x-2 my-1">
              <Checkbox
                checked={house.isLay}
                onChange={(val) => handleHouseChange(i, "isLay", val)}
                label="Lay Bet"
              />
            </div>
            <div className="flex items-center space-x-2 my-1">
              <Checkbox
                checked={house.hasCommission}
                onChange={(val) => handleHouseChange(i, "hasCommission", val)}
                label="Comissão (%)"
              />
            </div>
            {house.hasCommission && (
              <Input
                type="number"
                placeholder="Comissão %"
                value={house.commission}
                onChange={(e) =>
                  handleHouseChange(i, "commission", parseFloat(e.target.value))
                }
              />
            )}
            <div className="flex items-center space-x-2 my-1">
              <Checkbox
                checked={house.freebet}
                onChange={(val) => handleHouseChange(i, "freebet", val)}
                label="Freebet"
              />
            </div>
            <Input
              type="number"
              placeholder="Odds Boost"
              value={house.oddBoost}
              onChange={(e) =>
                handleHouseChange(i, "oddBoost", parseFloat(e.target.value))
              }
            />
            <div className="text-sm font-semibold mt-2 text-green-800">
              Lucro/Prejuízo: R$ {house.profit?.toFixed(2)}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 text-center space-y-2">
        <div className="text-green-800 font-semibold">
          Total Investido: R$ {totalStake.toFixed(2)}
        </div>
        <div className="text-green-800 font-semibold">
          Retorno Estimado: R$ {totalReturn.toFixed(2)}
        </div>
        <div className="text-green-900 font-bold text-lg">
          Lucro Global: R$ {totalProfit.toFixed(2)}
        </div>
        <Button
          onClick={calculateStakes}
          variant="default"
        >
          Calcular
        </Button>
      </div>
    </div>
  );
}
