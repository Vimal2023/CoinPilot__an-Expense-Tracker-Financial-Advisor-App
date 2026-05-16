import formatNumber from "@/utils";
import getFinancialAdvice from "@/utils/getFinancialAdvice";
import {
  PiggyBank,
  ReceiptText,
  Wallet,
  Sparkles,
  CircleDollarSign,
} from "lucide-react";
import React, { useEffect, useState } from "react";

function CardInfo({ budgetList, incomeList }) {
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [financialAdvice, setFinancialAdvice] = useState("");

  useEffect(() => {
    if (budgetList.length > 0 || incomeList.length > 0) {
      CalculateCardInfo();
    }
  }, [budgetList, incomeList]);

  useEffect(() => {
    if (totalBudget > 0 || totalIncome > 0 || totalSpend > 0) {
      const fetchFinancialAdvice = async () => {
        const advice = await getFinancialAdvice(totalBudget, totalIncome, totalSpend);
        setFinancialAdvice(advice);
      };
      fetchFinancialAdvice();
    }
  }, [totalBudget, totalIncome, totalSpend]);

  const CalculateCardInfo = () => {
    const totalBudget_ = budgetList.reduce(
      (acc, item) => acc + Number(item.amount || 0),
      0
    );
    const totalSpend_ = budgetList.reduce(
      (acc, item) => acc + Number(item.totalSpend || 0),
      0
    );
    const totalIncome_ = incomeList.reduce(
      (acc, item) => acc + Number(item.amount || 0),
      0
    );

    setTotalBudget(totalBudget_);
    setTotalSpend(totalSpend_);
    setTotalIncome(totalIncome_);
  };

  return (
    <div>
      {budgetList?.length > 0 ? (
        <div>
          {/* AI Advice Banner */}
          <div className="p-4 pl-5 border mt-4 -mb-1 rounded-2xl flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles
                className="rounded-full text-white w-9 h-9 p-2
                bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"
              />
              <span className="text-sm font-semibold whitespace-nowrap">Finan Smart AI</span>
            </div>
            <p className="text-sm font-light text-gray-600 leading-snug">
              {financialAdvice || "Loading financial advice..."}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 pl-5 border rounded-2xl flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Allocation</p>
                <h2 className="font-bold text-2xl mt-0.5">₹{formatNumber(totalBudget)}</h2>
              </div>
              <PiggyBank className="bg-green-800 p-3 h-11 w-11 rounded-full text-white shrink-0" />
            </div>

            <div className="p-4 pl-5 border rounded-2xl flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Op. Costs</p>
                <h2 className="font-bold text-2xl mt-0.5">₹{formatNumber(totalSpend)}</h2>
              </div>
              <ReceiptText className="bg-green-800 p-3 h-11 w-11 rounded-full text-white shrink-0" />
            </div>

            <div className="p-4 pl-5 border rounded-2xl flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wide">No. of Projects</p>
                <h2 className="font-bold text-2xl mt-0.5">{budgetList?.length}</h2>
              </div>
              <Wallet className="bg-green-800 p-3 h-11 w-11 rounded-full text-white shrink-0" />
            </div>

            <div className="p-4 pl-5 border rounded-2xl flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</p>
                <h2 className="font-bold text-2xl mt-0.5">₹{formatNumber(totalIncome)}</h2>
              </div>
              <CircleDollarSign className="bg-green-800 p-3 h-11 w-11 rounded-full text-white shrink-0" />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item, index) => (
            <div
              className="h-[100px] w-full bg-slate-200 animate-pulse rounded-2xl"
              key={index}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CardInfo;
