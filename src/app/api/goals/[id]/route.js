import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb.js";
import Goal from "../../../../../models/Goal.js";
import Quest from "../../../../../models/Quest.js";
import { createAuthenticatedHandler } from "../../../../../lib/auth.js";

// GET /api/goals/[id] - Get specific goal with quests
async function getGoal(request, { params }) {
  try {
    await connectDB();
    const userId = request.user._id;
    const { id: goalId } = await params;

    const goal = await Goal.findOne({ _id: goalId, userId });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Get all quests for this goal
    const quests = await Quest.find({ goalId, userId }).sort({ createdAt: 1 });

    // Organize quests by type
    const mainQuests = quests.filter((q) => q.type === "main");
    const subQuests = quests.filter((q) => q.type === "sub");
    const sideQuests = quests.filter((q) => q.type === "side");

    return NextResponse.json(
      {
        goal,
        quests: {
          main: mainQuests,
          sub: subQuests,
          side: sideQuests,
          all: quests,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get goal error:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Update goal
async function updateGoal(request, { params }) {
  try {
    await connectDB();
    const userId = request.user._id;
    const { id: goalId } = await params;

    const updates = await request.json();

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates._id;
    delete updates.createdAt;

    const goal = await Goal.findOneAndUpdate(
      { _id: goalId, userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Goal updated successfully",
        goal,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete goal and all associated quests
async function deleteGoal(request, { params }) {
  try {
    await connectDB();
    const userId = request.user._id;
    const { id: goalId } = await params;

    const goal = await Goal.findOne({ _id: goalId, userId });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Delete all quests associated with this goal
    await Quest.deleteMany({ goalId, userId });

    // Delete the goal
    await Goal.findByIdAndDelete(goalId);

    return NextResponse.json(
      {
        message: "Goal and associated quests deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete goal error:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}

export const GET = createAuthenticatedHandler(getGoal);
export const PUT = createAuthenticatedHandler(updateGoal);
export const DELETE = createAuthenticatedHandler(deleteGoal);
