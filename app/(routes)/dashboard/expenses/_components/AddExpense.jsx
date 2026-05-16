import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/utils/dbConfig";
import { projectAllocations, operationalCosts } from "@/utils/schema";
import { Loader } from "lucide-react";
import moment from "moment";
import React, { useState } from "react";
import { toast } from "sonner";

function AddExpense({ budgetId, user, refreshData }) {
  const [name, setName] = useState();
  const [amount, setAmount] = useState();
  const [loading, setLoading] = useState(false);

  /**
   * Used to Add New Operational Cost
   */
  const addNewExpense = async () => {
    setLoading(true);
    const result = await db
      .insert(operationalCosts)
      .values({
        name: name,
        amount: amount,
        allocationId: budgetId,
        createdAt: moment().format("DD/MM/yyy"),
      })
      .returning({ insertedId: projectAllocations.id });

    setAmount("");
    setName("");
    if (result) {
      setLoading(false);
      refreshData();
      toast("New Operational Cost Added!");
    }
    setLoading(false);
  };

  return (
    <div className="border p-5 rounded-2xl">
      <h2 className="font-bold text-lg">Add Operational Cost</h2>
      <div className="mt-2">
        <h2 className="text-black font-medium my-1">Cost Name</h2>
        <Input
          placeholder="e.g. Cloud Infrastructure"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mt-2">
        <h2 className="text-black font-medium my-1">Amount</h2>
        <Input
          placeholder="e.g. 5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <Button
        disabled={!(name && amount) || loading}
        onClick={() => addNewExpense()}
        className="mt-3 w-full rounded-full"
      >
        {loading ? <Loader className="animate-spin" /> : "Add Cost"}
      </Button>
    </div>
  );
}

export default AddExpense;
