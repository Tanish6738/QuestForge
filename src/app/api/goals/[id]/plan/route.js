import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb.js';
import { generateComprehensiveQuestPlan } from '../../../../../../lib/questGenerator.js';
import Goal from '../../../../../../models/Goal.js';
import QuestPlan from '../../../../../../models/QuestPlan.js';

// GET: Retrieve quest plan for a goal
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id: goalId } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if quest plan already exists
    let questPlan = await QuestPlan.findOne({ goalId, userId }).populate('dailyPlans.quests');
    
    if (!questPlan) {
      return NextResponse.json({ error: 'Quest plan not found. Please generate a new plan.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      questPlan: questPlan
    });

  } catch (error) {
    console.error('Error retrieving quest plan:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve quest plan',
      details: error.message 
    }, { status: 500 });
  }
}

// POST: Generate a new quest plan for the goal
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const { id: goalId } = await params;
    const { userId, regenerate = false } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if goal exists
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if user owns the goal
    if (goal.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Unauthorized access to goal' }, { status: 403 });
    }

    // Check if quest plan already exists
    let existingPlan = await QuestPlan.findOne({ goalId, userId });
    
    if (existingPlan && !regenerate) {
      return NextResponse.json({ 
        error: 'Quest plan already exists for this goal. Use regenerate=true to create a new plan.' 
      }, { status: 409 });
    }

    // Delete existing plan if regenerating
    if (existingPlan && regenerate) {
      await QuestPlan.deleteOne({ _id: existingPlan._id });
      // Note: In a production app, you might want to also handle existing quests
    }

    // Validate goal has required fields for plan generation
    if (!goal.dailyTimeAvailable) {
      return NextResponse.json({ 
        error: 'Goal must have dailyTimeAvailable set before generating a quest plan' 
      }, { status: 400 });
    }    // Generate comprehensive quest plan
    console.log('🚀 Starting quest plan generation for goal:', goalId);
    
    // Add timeout to prevent the request from hanging indefinitely
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Quest plan generation timeout after 60 seconds')), 60000)
    );
    
    const questPlanPromise = generateComprehensiveQuestPlan(goalId, userId);
    
    const questPlan = await Promise.race([questPlanPromise, timeoutPromise]);
    
    console.log('✅ Quest plan generation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Quest plan generated successfully',
      questPlan: questPlan
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating quest plan:', error);
    return NextResponse.json({ 
      error: 'Failed to generate quest plan',
      details: error.message 
    }, { status: 500 });
  }
}

// PUT: Update quest plan settings or regenerate specific days
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const goalId = params.id;
    const { userId, action, dayNumber, settings } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const questPlan = await QuestPlan.findOne({ goalId, userId });
    if (!questPlan) {
      return NextResponse.json({ error: 'Quest plan not found' }, { status: 404 });
    }

    if (action === 'updateSettings' && settings) {
      // Update adaptive settings
      if (settings.adaptiveSettings) {
        questPlan.adaptiveSettings = { ...questPlan.adaptiveSettings, ...settings.adaptiveSettings };
      }
      
      await questPlan.save();
      
      return NextResponse.json({
        success: true,
        message: 'Quest plan settings updated',
        questPlan: questPlan
      });
    }

    if (action === 'regenerateDay' && dayNumber) {
      // TODO: Implement day-specific regeneration
      return NextResponse.json({ 
        error: 'Day regeneration not yet implemented' 
      }, { status: 501 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating quest plan:', error);
    return NextResponse.json({ 
      error: 'Failed to update quest plan',
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE: Delete quest plan
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const goalId = params.id;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await QuestPlan.deleteOne({ goalId, userId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Quest plan not found' }, { status: 404 });
    }

    // TODO: Also delete associated quests in production
    
    return NextResponse.json({
      success: true,
      message: 'Quest plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting quest plan:', error);
    return NextResponse.json({ 
      error: 'Failed to delete quest plan',
      details: error.message 
    }, { status: 500 });
  }
}
