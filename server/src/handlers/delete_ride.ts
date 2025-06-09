
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteRide = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(ridesTable)
      .where(eq(ridesTable.id, id))
      .execute();

    // Check if any rows were affected (deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Ride deletion failed:', error);
    throw error;
  }
};
